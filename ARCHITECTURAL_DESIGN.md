# 🏗️ Architectural Design Document
## Applicant Selector Simulator with AI Mock Interview

**Version**: 1.0.0  
**Last Updated**: March 26, 2026  
**Repository**: https://github.com/Roshan9010/Selector-Applicant-Simulator

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [Security Architecture](#security-architecture)
9. [AI Integration Architecture](#ai-integration-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Scalability Considerations](#scalability-considerations)
12. [Error Handling Strategy](#error-handling-strategy)

---

## 🎯 System Overview

### Purpose
A web-based applicant tracking and selection system featuring AI-powered mock interviews, automated resume parsing, online examinations, and performance analytics.

### Key Features
- **User Authentication & Authorization** (JWT-based)
- **Resume Upload & Parsing** (AI-powered)
- **AI Mock Interviews** (Real-time voice interaction)
- **Online Examination System** (Timed assessments)
- **Performance Analytics** (Multi-dimensional scoring)
- **Admin Dashboard** (Candidate management)
- **AI Chatbot Assistant** (Contextual help)

### User Roles
1. **Candidate** - Job applicants
2. **Admin** - Recruiters/HR managers

---

## 🏛️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Candidate  │  │    Admin     │  │  AI Chatbot  │          │
│  │  Dashboard   │  │  Dashboard   │  │  (Floating)  │          │
│  │              │  │              │  │              │          │
│  │ - Profile    │  │ - Jobs       │  │ - Help       │          │
│  │ - Resume     │  │ - Candidates │  │ - Support    │          │
│  │ - Interview  │  │ - Exams      │  │ - Guidance   │          │
│  │ - Exams      │  │ - Analytics  │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│              React 18 + Vite + TailwindCSS                       │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS (Axios)
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                    FastAPI Backend (Port 8000)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Authentication Middleware (JWT)            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │   Auth     │ │ Candidate  │ │    Admin   │ │   Exam     │  │
│  │   Router   │ │   Router   │ │   Router   │ │   Router   │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                  │
│  ┌────────────┐ ┌────────────┐                                  │
│  │  Chatbot   │ │   Utility  │                                  │
│  │   Router   │ │   Router   │                                  │
│  └────────────┘ └────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Service │  │ Resume Parser│  │  Interview   │          │
│  │              │  │              │  │   Service    │          │
│  │ - Hash pwd   │  │ - Extract    │  │              │          │
│  │ - JWT token  │  │ - Skills     │  │ - Questions  │          │
│  │ - Verify     │  │ - Experience │  │ - Scoring    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Exam Service │  │  Analytics   │  │  Email Svc   │          │
│  │              │  │   Service    │  │              │          │
│  │ - Create     │  │ - Calculate  │  │ - Send OTP   │          │
│  │ - Auto-grade │  │ - Scores     │  │ - Links      │          │
│  │ - Timer      │  │ - Feedback   │  │ - Templates  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐          ┌──────────────────┐             │
│  │  Google Gemini   │          │   Email Service  │             │
│  │      API         │          │     (SMTP)       │             │
│  │                  │          │                  │             │
│  │ - Mock Interview │          │ - Password Reset │             │
│  │ - Report Gen     │          │ - Exam Links     │             │
│  │ - Rate Limiting  │          │ - Notifications  │             │
│  │  (429 handling)  │          │                  │             │
│  └──────────────────┘          └──────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                  SQLAlchemy ORM + SQLite Database                │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │   User     │ │  Candidate │ │    Exam    │ │   Result   │  │
│  │   Model    │ │   Model    │ │   Model    │ │   Model    │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                  │
│  │    Job     │ │ Application│ │  Interview │                  │
│  │ Requirement│ │   Model    │ │   Model    │                  │
│  └────────────┘ └────────────┘ └────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        PERSISTENCE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │      SQLite Database (sql_app.db)       │             │
│         │                                         │             │
│         │  Tables: Users, Candidates, Exams,      │             │
│         │  Results, JobRequirements, Applications,│             │
│         │  Interviews                             │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │       File Storage (uploads/)           │             │
│         │                                         │             │
│         │  - Resume PDFs/DOCX                     │             │
│         │  - Profile Photos                       │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI Framework |
| **Vite** | 5.x | Build Tool & Dev Server |
| **TailwindCSS** | 3.x | Utility-First CSS |
| **React Router** | 6.x | Client-side Routing |
| **Zustand** | 4.x | State Management |
| **Axios** | 1.x | HTTP Client |
| **Lucide Icons** | Latest | Icon Library |
| **SpeechRecognition** | Browser API | Voice Input |
| **SpeechSynthesis** | Browser API | Voice Output |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | Latest | Web Framework |
| **Python** | 3.11+ | Programming Language |
| **SQLAlchemy** | 2.x | ORM |
| **SQLite** | 3.x | Database |
| **PyJWT** | Latest | JWT Authentication |
| **Passlib** | Latest | Password Hashing |
| **python-multipart** | Latest | Form Data |
| **httpx** | Latest | Async HTTP Client |
| **python-docx** | Latest | DOCX Parsing |
| **PyPDF2** | Latest | PDF Parsing |

### External Services
| Service | Provider | Purpose |
|---------|----------|---------|
| **Gemini API** | Google | AI Mock Interviews & Analytics |
| **SMTP Server** | Gmail | Email Notifications |

---

## 🔧 System Components

### 1. Frontend Components

#### **Pages** (`frontend/src/pages/`)
- **Login.jsx** - User authentication
- **Register.jsx** - New user registration
- **AdminDashboard.jsx** - Admin control panel
- **CandidateDashboard.jsx** - Candidate workspace
- **ExamRoom.jsx** - Online examination interface
- **MockInterview.jsx** - AI-powered interview room
- **ForgotPassword.jsx** - Password recovery
- **ResetPassword.jsx** - Password reset

#### **Components** (`frontend/src/components/`)
- **AIChatbot.jsx** - Floating AI assistant widget

#### **State Management** (`frontend/src/store/`)
- **authStore.js** - Global authentication state (Zustand)

#### **Utilities** (`frontend/src/lib/`)
- **axios.js** - Configured Axios instance with interceptors

### 2. Backend Components

#### **Routers** (`backend/app/routers/`)
- **auth.py** - Authentication endpoints
- **admin.py** - Admin-specific endpoints
- **candidate.py** - Candidate-specific endpoints
- **exam.py** - Examination endpoints
- **chatbot.py** - AI chatbot & mock interview endpoints

#### **Core Files**
- **main.py** - FastAPI application initialization
- **models.py** - SQLAlchemy database models
- **schemas.py** - Pydantic validation schemas
- **database.py** - Database configuration
- **dependencies.py** - Dependency injection
- **utils_auth.py** - Authentication utilities
- **utils_email.py** - Email service utilities
- **resume_utils.py** - Resume parsing utilities

---

## 🔄 Data Flow

### Authentication Flow
```
1. User submits credentials → Login.jsx
2. POST /auth/login → FastAPI
3. Validate credentials → utils_auth.py
4. Generate JWT token → Return to client
5. Store token in Zustand → authStore.js
6. Include token in all requests → Axios interceptor
7. Verify token on backend → get_current_user dependency
```

### AI Mock Interview Flow
```
1. Candidate selects topics → MockInterview.jsx
2. Start interview → POST /candidate/mock-interview
3. Initialize conversation → Gemini API
4. User speaks → SpeechRecognition API
5. Convert to text → Send to backend
6. Process with AI → Gemini generates response
7. Return AI reply → Text-to-speech
8. Continue conversation loop
9. End interview → POST /candidate/mock-interview-report
10. Generate analytics → Display report
```

### Resume Upload Flow
```
1. Candidate uploads file → <input type="file">
2. POST /candidate/resume → FastAPI
3. Save to uploads/ → File storage
4. Parse content → resume_utils.py
5. Extract skills/experience → NLP processing
6. Update candidate profile → Database
7. Return parsed data → Frontend display
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│      User       │       │  JobRequirement  │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │◄──────│ id (PK)          │
│ email           │       │ title            │
│ hashed_password │       │ description      │
│ role            │       │ requirements     │
│ created_at      │       │ created_by (FK)  │
└─────────────────┘       │ created_at       │
         │                └──────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│    Candidate     │        │    Application   │
├──────────────────┤        ├──────────────────┤
│ id (PK)          │        │ id (PK)          │
│ user_id (FK)     │        │ job_id (FK)      │
│ full_name        │        │ candidate_id (FK)│
│ phone            │        │ status           │
│ resume_path      │        │ applied_at       │
│ skills           │        └──────────────────┘
│ experience       │
│ profile_completed│        ┌──────────────────┐
└──────────────────┘        │      Exam        │
         │                  ├──────────────────┤
         │                  │ id (PK)          │
         │                  │ application_id(FK│
         │                  │ questions        │
         │                  │ duration         │
         ▼                  │ score            │
┌──────────────────┐        │ created_at       │
│    Interview     │        └──────────────────┘
├──────────────────┤                 │
│ id (PK)          │                 │
│ candidate_id (FK)│                 │
│ questions        │                 │
│ responses        │                 ▼
│ overall_score    │        ┌──────────────────┐
│ communication_.. │        │     Result       │
│ technical_score  │        ├──────────────────┤
│ problem_solving..│        │ id (PK)          │
│ behavioral_score │        │ exam_id (FK)     │
│ detailed_feedback│        │ candidate_id (FK)│
│ strengths        │        │ score            │
│ areas_for_...    │        │ graded_at        │
│ recommendations  │        └──────────────────┘
└──────────────────┘
```

### Table Descriptions

#### **User**
Base user table for authentication
- `id`: Primary key
- `email`: Unique email address
- `hashed_password`: Bcrypt hashed password
- `role`: ENUM ('ADMIN', 'CANDIDATE')
- `created_at`: Timestamp

#### **Candidate**
Extended profile for candidates
- `id`: Primary key
- `user_id`: Foreign key to User
- `full_name`: Candidate name
- `phone`: Contact number
- `resume_path`: Path to uploaded resume
- `skills`: JSON array of extracted skills
- `experience`: Years of experience
- `profile_completed`: Boolean flag

#### **JobRequirement**
Job postings by admins
- `id`: Primary key
- `title`: Job title
- `description`: Job description
- `requirements`: JSON/Text of requirements
- `created_by`: Admin user ID
- `created_at`: Timestamp

#### **Application**
Job applications by candidates
- `id`: Primary key
- `job_id`: Foreign key to JobRequirement
- `candidate_id`: Foreign key to Candidate
- `status`: ENUM ('PENDING', 'SHORTLISTED', 'REJECTED')
- `applied_at`: Timestamp

#### **Exam**
Online examinations
- `id`: Primary key
- `application_id`: Foreign key to Application
- `questions`: JSON array of questions
- `duration`: Time limit in seconds
- `score`: Calculated score
- `created_at`: Timestamp

#### **Result**
Exam results
- `id`: Primary key
- `exam_id`: Foreign key to Exam
- `candidate_id`: Foreign key to Candidate
- `score`: Obtained score
- `graded_at`: Timestamp

#### **Interview**
AI Mock Interview records
- `id`: Primary key
- `candidate_id`: Foreign key to Candidate
- `questions`: JSON conversation history
- `responses`: AI-generated responses
- `overall_score`: Overall performance score
- `communication_score`: Communication rating
- `technical_score`: Technical knowledge rating
- `problem_solving_score`: Problem-solving rating
- `behavioral_score`: Behavioral assessment
- `detailed_feedback`: Text feedback
- `strengths`: JSON array
- `areas_for_improvement`: JSON array
- `recommendations`: JSON array

---

## 🌐 API Architecture

### RESTful API Design

#### **Base URL**: `http://localhost:8000`

#### **Authentication Endpoints**
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login user
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Reset password with OTP
```

#### **Admin Endpoints**
```
GET    /admin/candidates       - Get all candidates
POST   /admin/requirements     - Create job requirement
GET    /admin/requirements     - Get all job requirements
GET    /admin/shortlist        - Get shortlisted candidates
POST   /admin/shortlist/{id}   - Shortlist candidate
DELETE /admin/shortlist/{id}   - Remove from shortlist
```

#### **Candidate Endpoints**
```
GET    /candidate/profile      - Get candidate profile
POST   /candidate/profile      - Update profile
POST   /candidate/resume       - Upload resume
GET    /candidate/jobs         - View available jobs
POST   /candidate/apply/{id}   - Apply for job
GET    /candidate/applications - View applications
POST   /candidate/mock-interview         - Start AI interview
POST   /candidate/mock-interview-report  - Generate report
```

#### **Exam Endpoints**
```
GET    /exam/{id}              - Get exam details
POST   /exam/{id}/submit       - Submit exam
GET    /exam/{id}/result       - View result
```

#### **Chatbot Endpoint**
```
POST   /chat                   - Chat with AI assistant
```

### Request/Response Format

#### **Example: AI Mock Interview Request**
```json
POST /candidate/mock-interview
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "Hi, I'm ready for the interview" }]
    },
    {
      "role": "model",
      "parts": [{ "text": "Great! Let's start with a question about Java..." }]
    }
  ]
}
```

#### **Example: AI Mock Interview Response**
```json
{
  "reply": "Excellent! Now, can you explain the difference between abstract class and interface?"
}
```

#### **Example: Performance Report Response**
```json
{
  "overall_score": 85,
  "communication_score": 88,
  "technical_score": 82,
  "problem_solving_score": 80,
  "behavioral_score": 90,
  "detailed_feedback": "Strong performance overall...",
  "communication_feedback": "Excellent articulation...",
  "technical_feedback": "Good understanding of core concepts...",
  "strengths": [
    "Clear communication",
    "Strong problem-solving approach"
  ],
  "areas_for_improvement": [
    "Deepen knowledge of advanced patterns",
    "Practice more coding problems"
  ],
  "recommendations": [
    "Study design patterns",
    "Practice mock interviews regularly"
  ]
}
```

---

## 🔒 Security Architecture

### Authentication & Authorization

#### **JWT Token Flow**
```
1. User login → Validate credentials
2. Generate JWT token with payload:
   {
     "sub": "user@example.com",
     "role": "CANDIDATE",
     "exp": <timestamp>
   }
3. Sign with SECRET_KEY using HS256
4. Return token to client
5. Client stores in Zustand store
6. Include in Authorization header: "Bearer <token>"
7. Backend validates token on protected routes
```

#### **Password Security**
- **Hashing Algorithm**: bcrypt (via Passlib)
- **Salt Rounds**: 12
- **Storage**: Only hashed passwords stored
- **Transmission**: HTTPS (in production)

#### **Role-Based Access Control (RBAC)**
```python
# Dependency injection for role verification
async def get_current_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user
```

### Input Validation
- **Pydantic Schemas**: All request bodies validated
- **Sanitization**: SQL injection prevention via SQLAlchemy ORM
- **File Upload Validation**: Resume file type & size checks

### Environment Variables
```env
SECRET_KEY=<strong-random-secret>
GEMINI_API_KEY=<api-key>
SMTP_EMAIL=<email>
SMTP_PASSWORD=<app-password>
```

---

## 🤖 AI Integration Architecture

### Gemini API Integration

#### **Model Used**: `gemini-2.5-flash`

#### **Use Cases**
1. **Mock Interview Conversation**
   - Real-time Q&A
   - Context-aware follow-up questions
   - Topic-based customization

2. **Performance Analytics**
   - Multi-dimensional scoring
   - Detailed feedback generation
   - Strength/weakness identification

3. **Chatbot Assistant**
   - General queries
   - Application guidance
   - Exam support

#### **Rate Limiting Strategy**
```
HTTP 429 Handling:
1. Detect 429 response from Gemini API
2. Return user-friendly message
3. Set frontend rateLimited state
4. Display visual warning banner
5. Auto-retry after 15 seconds
6. Preserve conversation context
```

#### **Request Flow**
```
Frontend → FastAPI → Prepare prompt → Gemini API → Parse response → Frontend
                ↓
          Rate limit check
                ↓
          Error handling
```

#### **Prompt Engineering**
```python
system_instruction = """You are conducting a professional job interview as an AI interviewer. 
Your role is to:
1. Ask thoughtful technical and behavioral questions
2. Listen carefully to the candidate's responses
3. Ask follow-up questions based on their answers
4. Maintain a friendly but professional tone
5. Keep questions concise and focused
6. Evaluate responses naturally through conversation

Remember this is a MOCK INTERVIEW for practice. Be encouraging but also challenging."""
```

---

## 🚀 Deployment Architecture

### Development Environment
```
┌─────────────────────┐
│   Developer Machine │
├─────────────────────┤
│                     │
│  ┌───────────────┐  │
│  │   Frontend    │  │
│  │ localhost:5173│  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │    Backend    │  │
│  │ localhost:8000│  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │   SQLite DB   │  │
│  │  sql_app.db   │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Production Deployment (Recommended)

```
┌──────────────────────────────────────────────────┐
│              Cloud Provider (AWS/Azure/GCP)      │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────┐     ┌────────────────┐      │
│  │   Frontend     │     │    Backend     │      │
│  │   (Vercel/     │     │   (FastAPI on  │      │
│  │    Netlify)    │     │   EC2/Container)│     │
│  │                │     │                │      │
│  │  React SPA     │     │  Uvicorn       │      │
│  │  Static Files  │     │  Workers: 4    │      │
│  └────────────────┘     └────────────────┘      │
│         │                      │                 │
│         └──────────┬───────────┘                 │
│                    │                             │
│           ┌────────▼────────┐                    │
│           │  Load Balancer  │                    │
│           └────────┬────────┘                    │
│                    │                             │
│           ┌────────▼────────┐                    │
│           │  PostgreSQL DB  │                    │
│           │  (RDS/Azure SQL)│                    │
│           └─────────────────┘                    │
│                                                  │
│           ┌─────────────────┐                    │
│           │   File Storage  │                    │
│           │   (S3/Blob)     │                    │
│           └─────────────────┘                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Production Configuration

#### **Backend (.env)**
```env
SECRET_KEY=<production-secret-key-64-chars>
GEMINI_API_KEY=<production-api-key>
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=noreply@yourapp.com
SMTP_PASSWORD=<app-password>
INTERVIEW_LINK=https://yourapp.com/exam-room
CORS_ORIGINS=https://yourapp.com
```

#### **Frontend (.env)**
```env
VITE_API_BASE_URL=https://api.yourapp.com
VITE_APP_NAME="Applicant Selector Simulator"
```

---

## 📈 Scalability Considerations

### Current Limitations (SQLite)
- Single-file database
- No concurrent writes
- Suitable for: Development & small-scale (<100 users)

### Scaling Recommendations

#### **Phase 1: Database Migration**
```
SQLite → PostgreSQL/MySQL
- Use SQLAlchemy's connection pooling
- Configure pool_size and max_overflow
- Enable connection recycling
```

#### **Phase 2: Horizontal Scaling**
```
Backend:
- Deploy multiple Uvicorn workers
- Use Gunicorn with Uvicorn workers
- Implement sticky sessions or stateless auth

Frontend:
- CDN for static assets
- Browser caching strategies
- Code splitting for faster loads
```

#### **Phase 3: Caching Layer**
```
Redis Integration:
- Cache frequently accessed job listings
- Session storage (optional)
- Rate limiting cache
- Exam question caching
```

#### **Phase 4: Async Processing**
```
Celery/RQ for:
- Email sending (async)
- Resume parsing (background task)
- Report generation (async)
- Bulk operations
```

### Performance Optimization

#### **Database Indexes**
```sql
CREATE INDEX idx_candidate_user_id ON Candidate(user_id);
CREATE INDEX idx_application_job_id ON Application(job_id);
CREATE INDEX idx_exam_application_id ON Exam(application_id);
CREATE INDEX idx_user_email ON User(email);
```

#### **Query Optimization**
- Use `.select_related()` for foreign keys
- Implement pagination for large lists
- Add database-level constraints

#### **Frontend Optimization**
- Lazy loading for images/components
- Memoization of expensive calculations
- Debouncing for search inputs
- Virtual scrolling for long lists

---

## ⚠️ Error Handling Strategy

### Backend Error Handling

#### **Global Exception Handler**
```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

#### **HTTP Error Handlers**
```python
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
```

#### **Specific Error Types**
1. **429 Too Many Requests** (Gemini API)
   - User-friendly message
   - Visual indicator
   - Auto-retry logic

2. **401 Unauthorized**
   - Clear token expiry message
   - Redirect to login

3. **403 Forbidden**
   - Role-based access denial
   - Suggest appropriate role

4. **404 Not Found**
   - Resource doesn't exist
   - Suggest alternatives

5. **500 Internal Server Error**
   - Log full stack trace
   - Generic user message
   - Support contact info

### Frontend Error Handling

#### **Axios Interceptors**
```javascript
// Request interceptor
axios.interceptors.request.use(
  config => {
    const token = authStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired
      authStore.getState().logout();
      navigate('/login');
    }
    if (error.response?.status === 429) {
      // Rate limited
      showRateLimitWarning();
    }
    return Promise.reject(error);
  }
);
```

#### **User-Friendly Error Messages**
```javascript
const errorMessages = {
  400: "Invalid request. Please check your input.",
  401: "Session expired. Please login again.",
  403: "You don't have permission to access this.",
  404: "The requested resource was not found.",
  429: "Too many requests. Please wait a moment.",
  500: "Something went wrong. We're working on it.",
  503: "Service temporarily unavailable. Try again later."
};
```

### Logging Strategy

#### **Backend Logs**
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log levels:
# DEBUG - Detailed debugging info
# INFO - General operational events
# WARNING - Potential issues
# ERROR - Errors that don't stop the app
# CRITICAL - Serious errors requiring immediate attention
```

#### **Log Examples**
```
INFO:     User logged in: user@example.com
WARNING:  Rate limit approaching for Gemini API
ERROR:    Failed to parse resume: /path/to/file.pdf
CRITICAL: Database connection lost
```

---

## 🎯 Monitoring & Observability

### Metrics to Track
1. **API Performance**
   - Request latency (p50, p95, p99)
   - Requests per second
   - Error rates by endpoint

2. **User Metrics**
   - Active users (daily, weekly, monthly)
   - Login success/failure rates
   - Feature usage (interviews started, exams completed)

3. **AI Metrics**
   - Gemini API call volume
   - Rate limit frequency
   - Average response time
   - Token usage

4. **System Metrics**
   - Database query performance
   - Memory usage
   - CPU utilization
   - Disk space

### Health Check Endpoints
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_service": "available"
    }
```

---

## 📊 Disaster Recovery

### Backup Strategy
1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery capability
   - Off-site backup storage

2. **File Backups**
   - Resume uploads (S3 versioning)
   - Configuration files
   - Environment variables (secure vault)

3. **Code Backups**
   - Git repository (GitHub)
   - Multiple branches (main, develop, feature)
   - Tagged releases

### Recovery Procedures
1. **Database Restore**
   ```bash
   # Restore from SQL dump
   psql -U user -d dbname < backup.sql
   ```

2. **Application Redeploy**
   ```bash
   # Rollback to previous version
   git revert <commit-hash>
   git push origin main
   ```

---

## 🔮 Future Enhancements

### Planned Features
1. **Advanced Analytics Dashboard**
   - Real-time metrics visualization
   - Candidate comparison tools
   - Trend analysis

2. **Video Interview Recording**
   - Record mock interviews
   - Playback for self-review
   - Share with mentors

3. **Multi-language Support**
   - i18n implementation
   - Multiple language options
   - AI multi-language capability

4. **Mobile Application**
   - React Native app
   - Push notifications
   - Offline capability

5. **Integration Hub**
   - LinkedIn profile import
   - GitHub integration
   - ATS integrations

### Technical Debt
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Implement comprehensive testing suite
- [ ] Add API versioning
- [ ] Set up CI/CD pipeline
- [ ] Implement distributed tracing
- [ ] Add comprehensive documentation (Swagger/OpenAPI)

---

## 📖 References

- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- Gemini API Docs: https://ai.google.dev/docs
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- TailwindCSS: https://tailwindcss.com/docs

---

**Document End**
