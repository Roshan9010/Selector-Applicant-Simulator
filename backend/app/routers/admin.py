from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import asyncio
import uuid
from app import models, schemas, database
from app.dependencies import get_current_admin
from app.resume_utils import extract_text_from_file, parse_resume_with_ai_async
from app.utils_email import send_interview_invite, send_bulk_interview_invites

router = APIRouter()

@router.get("/dashboard")
def admin_dashboard(admin: models.User = Depends(get_current_admin), db: Session = Depends(database.get_db)):
    candidates_count = db.query(models.User).filter(models.User.role == "CANDIDATE").count()
    return {"message": f"Welcome Admin {admin.name}", "candidates_count": candidates_count}

@router.post("/job-requirements", response_model=schemas.JobRequirementCreate)
def create_job_requirement(req: schemas.JobRequirementCreate, admin: models.User = Depends(get_current_admin), db: Session = Depends(database.get_db)):
    db_req = models.JobRequirement(**req.model_dump())
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return req

@router.get("/job-requirements", response_model=List[schemas.JobRequirementCreate])
def get_job_requirements(admin: models.User = Depends(get_current_admin), db: Session = Depends(database.get_db)):
    reqs = db.query(models.JobRequirement).all()
    return reqs

@router.get("/applicants")
def get_applicants(admin: models.User = Depends(get_current_admin), db: Session = Depends(database.get_db)):
    # Join users and candidate profiles
    candidates = db.query(models.User).filter(models.User.role == "CANDIDATE").all()
    results = []
    for c in candidates:
        profile = c.candidate_profile
        results.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "skills": profile.skills if profile else None,
            "graduation_year": profile.graduation_year if profile else None,
            "percentage": profile.percentage if profile else None,
            "rank_score": profile.rank_score if profile else 0,
            # Include all additional profile fields for detailed view
            "college_name": profile.college_name if profile else None,
            "college_location": profile.college_location if profile else None,
            "degree": profile.degree if profile else None,
            "course": profile.course if profile else None,
            "organization_details": profile.organization_details if profile else None,
            "current_salary": profile.current_salary if profile else None,
            "technologies_worked_on": profile.technologies_worked_on if profile else None,
            "resume_path": profile.resume_path if profile else None
        })
    # Sort by rank
    results = sorted(results, key=lambda x: x["rank_score"], reverse=True)
    return results

# Bulk Resume handling and filtering system logic
@router.post("/bulk-filter-resumes")
async def bulk_filter_resumes(
    skills: str = Form(...),
    experience: int = Form(...),
    resumes: List[UploadFile] = File(...),
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    temp_dir = "temp_resumes"
    os.makedirs(temp_dir, exist_ok=True)
    
    # 1. Extract ALL texts from ALL files
    all_resumes_to_process = []
    for upload_file in resumes:
        # Use a safe unique filename to avoid Windows path/character issues
        safe_name = f"{uuid.uuid4()}_{upload_file.filename}"
        file_path = os.path.join(temp_dir, safe_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        
        try:
            texts = extract_text_from_file(file_path)
            print(f"DEBUG: File '{upload_file.filename}' -> Extracted {len(texts)} entries.")
            for i, text in enumerate(texts[:50]):
                if text.strip() or len(texts) == 1: # Always include if it's the only one
                    all_resumes_to_process.append({
                        "filename": upload_file.filename,
                        "text": text,
                        "index": i,
                        "total": len(texts)
                    })
        except Exception as e:
            print(f"CRITICAL: Extraction failed for {upload_file.filename}: {e}")
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

    print(f"DEBUG: Total resumes in processing queue: {len(all_resumes_to_process)}")

    if not all_resumes_to_process:
        print("DEBUG: No resumes extracted from any file.")
        return []

    # 2. Process ALL individual resumes in parallel with Semaphore
    semaphore = asyncio.Semaphore(15) # Global limit
    req_skills_raw = [s.strip().lower() for s in skills.split(',') if s.strip()]

    async def process_item(item):
        async with semaphore:
            text = item['text']
            print(f"DEBUG: Processing {item['filename']} (Text length: {len(text)})")
            extracted_data = await parse_resume_with_ai_async(text)
            
            # Ensure we ALWAYS return a result to avoid "No Match"
            if not extracted_data:
                extracted_data = {
                    "name": "Unknown",
                    "email": "N/A",
                    "skills": [],
                    "experience_years": 0,
                    "evaluation_summary": "AI extraction failed entirely."
                }
            
            ext_skills = [s.lower() for s in extracted_data.get('skills', [])]
            matches = []
            missing = []
            text_lower = text.lower()
            
            for rs in req_skills_raw:
                if (rs in ext_skills) or (rs in text_lower):
                    matches.append(rs)
                else:
                    missing.append(rs)
            
            m_score = int((len(matches) / len(req_skills_raw)) * 100) if req_skills_raw else 100
            e_exp = extracted_data.get('experience_years', 0)
            
            # Label entry
            fname = item['filename']
            if item['total'] > 1:
                fname = f"{fname} (Entry {item['index']+1})"
            
            return {
                "filename": fname,
                "name": extracted_data.get('name', 'Unknown'),
                "email": extracted_data.get('email', 'N/A'),
                "match_reason": extracted_data.get('evaluation_summary', 'AI successfully parsed this resume.'),
                "match_score": m_score,
                "experience": e_exp,
                "skills": matches,
                "missing_skills": missing,
                "debug_snippet": text[:200]
            }

    tasks = [process_item(it) for it in all_resumes_to_process]
    results = await asyncio.gather(*tasks)
    
    # Filter out None and sort
    final_results = [r for r in results if r is not None]
    final_results.sort(key=lambda x: x['match_score'], reverse=True)
    
    print(f"DEBUG: Returning total {len(final_results)} results to frontend UI.")
    return final_results


@router.get("/resume/{candidate_id}")
async def get_candidate_resume(
    candidate_id: int,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    """
    Get the resume file for a specific candidate
    """
    # Get candidate profile
    profile = db.query(models.CandidateProfile).filter(
        models.CandidateProfile.user_id == candidate_id
    ).first()
    
    if not profile or not profile.resume_path:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Check if file exists in uploads directory
    uploads_dir = "uploads"
    possible_paths = [
        os.path.join(uploads_dir, profile.resume_path),
        os.path.join(uploads_dir, f"{candidate_id}_{profile.resume_path}"),
        profile.resume_path  # If it's already a full path
    ]
    
    for file_path in possible_paths:
        if os.path.exists(file_path):
            # Get filename from path
            filename = os.path.basename(file_path)
            
            # Determine media type based on extension
            ext = os.path.splitext(filename)[1].lower()
            media_type_map = {
                '.pdf': 'application/pdf',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.doc': 'application/msword',
                '.txt': 'text/plain'
            }
            media_type = media_type_map.get(ext, 'application/octet-stream')
            
            return FileResponse(
                file_path,
                media_type=media_type,
                filename=filename
            )
    
    raise HTTPException(status_code=404, detail="Resume file not found on server")


@router.post("/send-interview-invite")
def send_single_interview_invite(
    candidate_email: str,
    candidate_name: str,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    """
    Send interview invitation to a single candidate
    """
    try:
        success = send_interview_invite(candidate_email, candidate_name)
        if success:
            return {"message": f"Interview invite sent successfully to {candidate_name}", "status": "success"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email. Please check email configuration.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-bulk-interview-invites")
def send_bulk_interview_invites_endpoint(
    candidates: list,
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    """
    Send interview invitations to multiple candidates at once
    Expects: [{"email": "...", "name": "..."}, ...]
    """
    try:
        result = send_bulk_interview_invites(candidates)
        return {
            "message": f"Invites sent: {result['success_count']} successful, {result['failed_count']} failed",
            "status": "success",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
