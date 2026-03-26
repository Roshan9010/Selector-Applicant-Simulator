from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # "ADMIN" or "CANDIDATE"
    name = Column(String)
    
    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False)

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skills = Column(String)
    graduation_year = Column(Integer)
    percentage = Column(Float)
    resume_path = Column(String)
    organization_details = Column(String, nullable=True)
    current_salary = Column(Float, nullable=True)
    technologies_worked_on = Column(String, nullable=True)
    
    college_name = Column(String, nullable=True)
    college_location = Column(String, nullable=True)
    degree = Column(String, nullable=True)
    course = Column(String, nullable=True)
    
    rank_score = Column(Float, default=0.0)

    user = relationship("User", back_populates="candidate_profile")

class JobRequirement(Base):
    __tablename__ = "job_requirements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    required_skills = Column(String)
    min_experience = Column(Integer)
    graduation_year = Column(Integer)
    min_percentage = Column(Float)
    company_details = Column(Text, nullable=True)

class ExamResult(Base):
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)
    warnings = Column(Integer, default=0)
    tab_switches = Column(Integer, default=0)
    camera_violations = Column(Integer, default=0)
    exam_duration = Column(Integer) # In seconds
