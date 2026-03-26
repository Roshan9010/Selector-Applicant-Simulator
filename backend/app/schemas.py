from pydantic import BaseModel
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str # "ADMIN" | "CANDIDATE"

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class JobRequirementCreate(BaseModel):
    title: str
    required_skills: str
    min_experience: int
    graduation_year: int
    min_percentage: float
    company_details: Optional[str] = None

class CandidateRegistration(BaseModel):
    skills: str
    graduation_year: int
    percentage: float
    college_name: str
    college_location: str
    degree: str
    course: str
    organization_details: Optional[str] = None
    current_salary: Optional[float] = None
    technologies_worked_on: Optional[str] = None

class ExamResultCreate(BaseModel):
    score: float
    warnings: int
    tab_switches: int
    camera_violations: int
    exam_duration: int

class ChatMessage(BaseModel):
    message: str
