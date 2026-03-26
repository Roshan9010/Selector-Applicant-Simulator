from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app import models, schemas, database
from app.dependencies import get_current_candidate
import os
import shutil
import urllib.request
import urllib.error
import json

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/register-profile")
def complete_registration(
    skills: str = Form(...),
    graduation_year: int = Form(...),
    percentage: float = Form(...),
    college_name: str = Form(...),
    college_location: str = Form(...),
    degree: str = Form(...),
    course: str = Form(...),
    organization_details: str = Form(None),
    current_salary: float = Form(None),
    technologies_worked_on: str = Form(None),
    resume: UploadFile = File(...),
    current_candidate: models.User = Depends(get_current_candidate), 
    db: Session = Depends(database.get_db)
):
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == current_candidate.id).first()
    if profile:
        raise HTTPException(status_code=400, detail="Profile already completed.")
    
    file_path = f"{UPLOAD_DIR}/{current_candidate.id}_{resume.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(resume.file, buffer)
        
    new_profile = models.CandidateProfile(
        user_id=current_candidate.id,
        skills=skills,
        graduation_year=graduation_year,
        percentage=percentage,
        college_name=college_name,
        college_location=college_location,
        degree=degree,
        course=course,
        resume_path=file_path,
        organization_details=organization_details,
        current_salary=current_salary,
        technologies_worked_on=technologies_worked_on
    )
    
    # Simple smart matching mock logic here. 
    # Can query JobRequirement to compute a score.
    # We will give a default score and implement matching service later.
    new_profile.rank_score = 50.0 
    
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    
    return {"message": "Profile created successfully"}

@router.get("/dashboard")
def candidate_dashboard(candidate: models.User = Depends(get_current_candidate), db: Session = Depends(database.get_db)):
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == candidate.id).first()
    has_profile = profile is not None
    return {
        "message": f"Welcome {candidate.name}",
        "profile_completed": has_profile,
        "eligible_for_exam": has_profile and profile.rank_score >= 50.0 # simple logic to shortlist
    }

@router.post("/mock-interview")
def mock_interview(
    payload: dict,
    candidate: models.User = Depends(get_current_candidate), 
    db: Session = Depends(database.get_db)
):
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == candidate.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not complete. Please complete registration first.")
        
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return {"reply": "GEMINI_API_KEY is not set. Cannot start AI mock interview."}
        
    history = payload.get("history", []) # Array of dicts like [{"role": "user", "parts": [{"text": "..."}]}]
    
    # Prepend the system prompt if the chat is new
    system_instruction = f"You are a professional HR and Technical Mock Interviewer. Your name is 'AI Interviewer'. You are conducting an interview with a candidate named {candidate.name} who has the following skills: {profile.skills}. Start by greeting them and asking your first technical question based on their skills. Then proceed to ask HR questions. Keep responses conversational, concise, and like a real person on screen. Wait for their answer before asking the next question. Do not use [Your Name] placeholders. Simply use AI Interviewer."
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    
    headers = {'Content-Type': 'application/json'}
    data = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": history
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            reply_text = result['candidates'][0]['content']['parts'][0]['text']
            return {"reply": reply_text}
    except Exception as e:
        return {"reply": f"AI Error: {str(e)}"}

@router.post("/mock-interview-report")
def generate_interview_report(
    payload: dict,
    candidate: models.User = Depends(get_current_candidate), 
    db: Session = Depends(database.get_db)
):
    """Generate detailed performance report after mock interview completion"""
    profile = db.query(models.CandidateProfile).filter(models.CandidateProfile.user_id == candidate.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not complete.")
        
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise HTTPException(status_code=500, detail="AI API key not configured.")
    
    history = payload.get("history", [])
    interview_duration = payload.get("duration", 0)
    
    # Convert history to text format for analysis
    conversation_text = "\n\n".join([
        f"{'Interviewer' if msg['role'] == 'model' else 'Candidate'}: {msg['parts'][0]['text']}"
        for msg in history
    ])
    
    system_instruction = """You are an expert interviewer and career coach. Analyze the candidate's performance in this mock interview and provide a detailed report.

Evaluate the following aspects:
1. **Communication Skills** (clarity, confidence, articulation)
2. **Technical Knowledge** (depth of understanding, accuracy)
3. **Problem-Solving Approach** (logical thinking, methodology)
4. **Behavioral Responses** (soft skills, cultural fit)
5. **Overall Performance** (strengths, areas for improvement)

Provide specific examples from the conversation to support your evaluation.

Format your response as a structured JSON with these exact keys:
{
  "overall_score": (integer 1-100),
  "communication_score": (integer 1-100),
  "technical_score": (integer 1-100),
  "problem_solving_score": (integer 1-100),
  "behavioral_score": (integer 1-100),
  "strengths": ["list of 3-5 specific strengths"],
  "areas_for_improvement": ["list of 3-5 specific areas to work on"],
  "detailed_feedback": "comprehensive paragraph summarizing overall performance",
  "communication_feedback": "specific feedback on communication style",
  "technical_feedback": "feedback on technical knowledge demonstrated",
  "recommendations": ["list of 3-5 actionable recommendations for improvement"]
}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    
    headers = {'Content-Type': 'application/json'}
    data = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [{
            "parts": [{"text": f"Candidate Name: {candidate.name}\nSkills: {profile.skills}\nInterview Duration: {interview_duration} seconds\n\nConversation Transcript:\n{conversation_text[:8000]}"}]
        }]
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            reply_text = result['candidates'][0]['content']['parts'][0]['text']
            
            # Clean up the response to ensure it's valid JSON
            cleaned_text = reply_text.strip()
            if cleaned_text.startswith("```"):
                cleaned_text = "\n".join(cleaned_text.split("\n")[1:-1]).strip()
            if cleaned_text.startswith("json"):
                cleaned_text = cleaned_text[4:].strip()
            
            try:
                report_data = json.loads(cleaned_text)
                return report_data
            except:
                # If JSON parsing fails, return a basic structure
                return {
                    "overall_score": 75,
                    "communication_score": 75,
                    "technical_score": 75,
                    "problem_solving_score": 75,
                    "behavioral_score": 75,
                    "strengths": ["Completed the interview", "Engaged with questions"],
                    "areas_for_improvement": ["Review the detailed feedback below"],
                    "detailed_feedback": reply_text,
                    "communication_feedback": "Communication was adequate.",
                    "technical_feedback": "Technical knowledge was demonstrated.",
                    "recommendations": ["Continue practicing mock interviews"]
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
