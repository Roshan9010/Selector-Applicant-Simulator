from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
from app import models, schemas, database
from app.utils_auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    email: str
    new_password: str

router = APIRouter()

@router.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd, role=user.role, name=user.name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role}

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.role and user.role != db_user.role:
        raise HTTPException(status_code=403, detail=f"This account is registered as {db_user.role}, not {user.role}.")
        
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer", "role": db_user.role}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordReq, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == req.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Email not found")
    # Mocking the email sending
    print(f"MOCK: Sent reset link to {req.email}")
    return {"message": "Password reset instructions sent to your email."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordReq, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == req.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    db_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password successfully reset."}
