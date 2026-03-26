from app.database import SessionLocal, engine
from app import models
from app.utils_auth import get_password_hash

def populate():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create Admin
    admin_email = "admin@example.com"
    if not db.query(models.User).filter_by(email=admin_email).first():
        hashed_password = get_password_hash("admin123")
        admin = models.User(email=admin_email, name="HR Manager", role="ADMIN", hashed_password=hashed_password)
        db.add(admin)
        db.commit()

    # Create Job Requirements
    if db.query(models.JobRequirement).count() == 0:
        job1 = models.JobRequirement(
            title="Frontend Developer",
            required_skills="React, Tailwind, JS",
            min_experience=1,
            graduation_year=2023,
            min_percentage=60.0,
            company_details="Tech Innovations Inc"
        )
        job2 = models.JobRequirement(
            title="Backend Engineer",
            required_skills="Python, FastAPI, SQL",
            min_experience=2,
            graduation_year=2022,
            min_percentage=70.0,
            company_details="Tech Innovations Inc"
        )
        db.add_all([job1, job2])
        db.commit()

    # Create Mock Candidates
    candidate_email = "alex@example.com"
    if not db.query(models.User).filter_by(email=candidate_email).first():
        hashed_password = get_password_hash("candidate123")
        candidate1 = models.User(email=candidate_email, name="Alex Smith", role="CANDIDATE", hashed_password=hashed_password)
        db.add(candidate1)
        db.commit()

        # Add profile for Alex
        profile1 = models.CandidateProfile(
            user_id=candidate1.id,
            skills="React, Node, HTML, CSS",
            graduation_year=2023,
            percentage=85.0,
            resume_path="mock_resume_alex.pdf",
            organization_details="WebCorp",
            current_salary=5.5,
            technologies_worked_on="React, Tailwind",
            rank_score=88.5 
        )
        db.add(profile1)
        db.commit()
    
    candidate2_email = "sarah@example.com"
    if not db.query(models.User).filter_by(email=candidate2_email).first():
        hashed_password = get_password_hash("candidate123")
        candidate2 = models.User(email=candidate2_email, name="Sarah Jones", role="CANDIDATE", hashed_password=hashed_password)
        db.add(candidate2)
        db.commit()

        # Add profile for Sarah
        profile2 = models.CandidateProfile(
            user_id=candidate2.id,
            skills="Python, Django, AWS",
            graduation_year=2022,
            percentage=92.0,
            resume_path="mock_resume_sarah.pdf",
            organization_details="DataSys",
            current_salary=8.0,
            technologies_worked_on="Python, Docker",
            rank_score=95.0 
        )
        db.add(profile2)
        db.commit()

    print("Sample data successfully populated.")
    print("Admin Email: admin@example.com | Password: admin123")
    print("Candidate Email: alex@example.com | Password: candidate123")

if __name__ == "__main__":
    populate()
