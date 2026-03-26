from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import auth, admin, candidate, exam, chatbot

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Applicant Selector Simulator", description="Recruitment app backend with smart scoring & proctoring.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For simplicity; update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    import sys
    print(f"VALIDATION ERROR: {exc.errors()}", file=sys.stderr)
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Workflow"])
app.include_router(candidate.router, prefix="/api/candidate", tags=["Candidate Workflow"])
app.include_router(exam.router, prefix="/api/exam", tags=["Online Exam"])
app.include_router(chatbot.router, prefix="/api/bot", tags=["AI Chatbot"])

@app.get("/")
def read_root():
    return {"status": "Running", "app": "Applicant Selector Simulator"}

