from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, database
from app.dependencies import get_current_candidate

router = APIRouter()

@router.post("/submit")
def submit_exam(
    result: schemas.ExamResultCreate, 
    candidate: models.User = Depends(get_current_candidate), 
    db: Session = Depends(database.get_db)
):
    # Check if existing result exists
    existing = db.query(models.ExamResult).filter(models.ExamResult.candidate_id == candidate.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Exam already submitted")
        
    db_result = models.ExamResult(
        candidate_id=candidate.id,
        score=result.score,
        warnings=result.warnings,
        tab_switches=result.tab_switches,
        camera_violations=result.camera_violations,
        exam_duration=result.exam_duration
    )
    db.add(db_result)
    db.commit()
    return {"message": "Exam submitted successfully", "score": float(result.score)}
