# 🏗️ Architecture Visual Guide
## Quick Reference for Applicant Selector Simulator

---

## 📐 High-Level Architecture (50,000 ft View)

```
┌────────────────────────────────────────────────────────────┐
│                     USERS (Browser)                        │
│  ┌──────────────┐              ┌──────────────┐           │
│  │  Candidate   │              │    Admin     │           │
│  │   Browser    │              │   Browser    │           │
│  └──────────────┘              └──────────────┘           │
└────────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌────────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                         │
│            React SPA (http://localhost:5173)               │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Pages + Components + State Management (Zustand)   │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                          ↕ REST API (Axios)
┌────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│          FastAPI Backend (http://localhost:8000)           │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Routers + Services + Business Logic + Middleware  │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                    ↕                    ↕
        ┌───────────┴────────┐   ┌──────┴────────┐
        │                    │   │               │
┌──────────────┐    ┌──────────────┐   ┌──────────────┐
│ SQLite DB    │    │ Gemini AI    │   │ SMTP Email   │
│ sql_app.db   │    │ API          │   │ Service      │
└──────────────┘    └──────────────┘   └──────────────┘
```

---

## 🔄 Request Flow Example: Candidate Login

```
┌──────┐         ┌──────┐         ┌──────┐         ┌──────┐
│ User │         │React │         │FastAPI│        │ SQLite│
│      │         │      │         │       │        │       │
└──┬───┘         └──┬───┘         └──┬────┘        └──┬────┘
   │                │                 │                │
   │ 1. Enter creds │                 │                │
   │───────────────>│                 │                │
   │                │                 │                │
   │                │ 2. POST /auth/  │                │
   │                │    login        │                │
   │                │────────────────>│                │
   │                │                 │                │
   │                │                 │ 3. Query user  │
   │                │                 │───────────────>│
   │                │                 │                │
   │                │                 │ 4. User data   │
   │                │                 │<───────────────│
   │                │                 │                │
   │                │                 │ 5. Verify pwd  │
   │                │                 │ 6. Gen JWT     │
   │                │                 │                │
   │                │ 7. Return token │                │
   │                │<────────────────│                │
   │                │                 │                │
   │ 8. Store token │                 │                │
   │<───────────────│                 │                │
   │                │                 │                │
   │ 9. Navigate to │                 │                │
   │    dashboard   │                 │                │
   │                │                 │                │
```

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.jsx (Root)
│
├── Router (React Router)
│   │
│   ├── Login Page
│   ├── Register Page
│   ├── ForgotPassword Page
│   ├── ResetPassword Page
│   │
│   ├── Protected Routes (Admin)
│   │   └── AdminDashboard
│   │       ├── Job Management
│   │       ├── Candidate List
│   │       └── Analytics Panel
│   │
│   ├── Protected Routes (Candidate)
│   │   └── CandidateDashboard
│   │       ├── Profile Section
│   │       ├── Resume Upload
│   │       ├── Job Applications
│   │       ├── Mock Interview Button
│   │       └── Exam Status
│   │
│   ├── MockInterview Page
│   │   ├── Topic Selection
│   │   ├── Interview Room
│   │   │   ├── AI Visual (Animated Orb)
│   │   │   ├── User Camera (PIP)
│   │   │   ├── Timer Display
│   │   │   └── Transcript Area
│   │   └── Performance Report
│   │
│   └── ExamRoom Page
│
└── AIChatbot (Floating Widget - Global)
```

### State Management Flow

```
┌─────────────────┐
│  authStore.js   │  (Zustand Store)
│  ─────────────  │
│  - token        │
│  - role         │
│  - email        │
│  - login()      │
│  - logout()     │
└────────┬────────┘
         │
         │ Updates
         │
┌────────▼────────────────────────────────────────┐
│              React Components                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Login   │  │Dashboard │  │Interview │     │
│  │          │  │          │  │          │     │
│  │ Uses:    │  │ Uses:    │  │ Uses:    │     │
│  │ login()  │  │ token    │  │ token    │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Backend Architecture

### Layered Architecture

```
┌───────────────────────────────────────────────────┐
│              HTTP Layer (FastAPI)                 │
│  ┌─────────────────────────────────────────────┐ │
│  │  Routers (Endpoints)                        │ │
│  │  - auth.py                                  │ │
│  │  - admin.py                                 │ │
│  │  - candidate.py                             │ │
│  │  - exam.py                                  │ │
│  │  - chatbot.py                               │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
                      ↕
┌───────────────────────────────────────────────────┐
│           Business Logic Layer                    │
│  ┌─────────────────────────────────────────────┐ │
│  │  Services                                   │ │
│  │  - Authentication Service                   │ │
│  │  - Resume Parsing Service                   │ │
│  │  - Interview Service                        │ │
│  │  - Exam Service                             │ │
│  │  - Analytics Service                        │ │
│  │  - Email Service                            │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
                      ↕
┌───────────────────────────────────────────────────┐
│           Data Access Layer (SQLAlchemy)          │
│  ┌─────────────────────────────────────────────┐ │
│  │  Models                                     │ │
│  │  - User                                     │ │
│  │  - Candidate                                │ │
│  │  - JobRequirement                           │ │
│  │  - Application                              │ │
│  │  - Exam                                     │ │
│  │  - Result                                   │ │
│  │  - Interview                                │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

---

## 🗄️ Database Entity Relationships (Simplified)

```
         ┌─────────────┐
         │    User     │
         │ ─────────── │
         │ PK id       │
         │ email       │
         │ password    │
         │ role        │◄──────┐
         └──────┬──────┘       │
                │              │
         ┌──────┴──────┐       │
         │             │       │
    ┌────▼────┐   ┌────▼────┐ │
    │Candidate│   │  Admin  │ │
    │─────────│   └─────────┘ │
    │FK user_id│               │
    └────┬────┘               │
         │                    │
    ┌────▼─────────┐          │
    │ Application  │          │
    │──────────────│          │
    │FK job_id     │          │
    │FK candidate_id         │
    └────┬─────────┘          │
         │                    │
    ┌────▼─────┐         ┌───▼────────┐
    │   Exam   │         │JobRequirement│
    │──────────│         │────────────│
    │FK app_id │         │FK created_by│
    └────┬─────┘         └────────────┘
         │
    ┌────▼─────┐
    │  Result  │
    │──────────│
    │FK exam_id│
    └──────────┘

    ┌──────────────┐
    │  Interview   │
    │──────────────│
    │FK candidate_id│
    │scores        │
    │feedback      │
    └──────────────┘
```

---

## 🤖 AI Integration Flow

### Mock Interview Sequence

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Candidate│      │  React   │      │ FastAPI  │      │Gemini AI │
│          │      │          │      │          │      │          │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │ Select topics   │                 │                 │
     │────────────────>│                 │                 │
     │                 │                 │                 │
     │                 │ POST /mock-     │                 │
     │                 │ interview       │                 │
     │                 │ with topics     │                 │
     │                 │────────────────>│                 │
     │                 │                 │                 │
     │                 │                 │ Build prompt    │
     │                 │                 │ with system     │
     │                 │                 │ instructions    │
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │                 │                 │ AI greeting     │
     │                 │                 │<────────────────│
     │                 │                 │                 │
     │                 │ Return reply    │                 │
     │                 │<────────────────│                 │
     │                 │                 │                 │
     │ Play audio +    │                 │                 │
     │ display text    │                 │                 │
     │<────────────────│                 │                 │
     │                 │                 │                 │
     │ Speak answer    │                 │                 │
     │────────────────>│                 │                 │
     │                 │                 │                 │
     │                 │ Speech-to-text  │                 │
     │                 │────────────────>│                 │
     │                 │                 │                 │
     │                 │                 │ Send to Gemini  │
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │                 │                 │ AI response     │
     │                 │                 │<────────────────│
     │                 │                 │                 │
     │                 │ Loop continues...                 │
     │                 │                 │                 │
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────┐
│            Security Defense in Depth            │
└─────────────────────────────────────────────────┘

Layer 1: Transport Security
┌─────────────────────────────────────────────────┐
│  Production: HTTPS (TLS/SSL)                    │
│  Prevents: Man-in-the-middle attacks            │
└─────────────────────────────────────────────────┘

Layer 2: Authentication
┌─────────────────────────────────────────────────┐
│  JWT Tokens (HS256 signed)                      │
│  Token expiry: Configurable                     │
│  Refresh tokens: Future enhancement             │
└─────────────────────────────────────────────────┘

Layer 3: Authorization
┌─────────────────────────────────────────────────┐
│  Role-Based Access Control (RBAC)               │
│  - ADMIN role                                   │
│  - CANDIDATE role                               │
│  Dependency injection for route protection      │
└─────────────────────────────────────────────────┘

Layer 4: Input Validation
┌─────────────────────────────────────────────────┐
│  Pydantic schemas                               │
│  Type checking                                  │
│  SQL injection prevention (ORM)                 │
└─────────────────────────────────────────────────┘

Layer 5: Password Security
┌─────────────────────────────────────────────────┐
│  bcrypt hashing (12 salt rounds)                │
│  Never store plain text passwords               │
└─────────────────────────────────────────────────┘

Layer 6: Environment Isolation
┌─────────────────────────────────────────────────┐
│  .env files (not in git)                        │
│  Virtual environments                           │
│  CORS configuration                             │
└─────────────────────────────────────────────────┘
```

---

## 📦 Deployment Options

### Option A: All-in-One Server (Simple)

```
┌──────────────────────────┐
│   Single VPS/EC2         │
│                          │
│  ┌────────────────────┐ │
│  │  Nginx (Reverse    │ │
│  │     Proxy)         │ │
│  └─────────┬──────────┘ │
│            │            │
│  ┌─────────▼──────────┐ │
│  │  Frontend (Static) │ │
│  │  Served by Nginx   │ │
│  └────────────────────┘ │
│            │            │
│  ┌─────────▼──────────┐ │
│  │  Backend (FastAPI) │ │
│  │  Uvicorn + Gunicorn│ │
│  └─────────┬──────────┘ │
│            │            │
│  ┌─────────▼──────────┐ │
│  │  PostgreSQL        │ │
│  │  Database          │ │
│  └────────────────────┘ │
│                          │
│  File Storage: Local or  │
│  S3-compatible           │
└──────────────────────────┘
```

### Option B: Modern Cloud-Native (Recommended)

```
┌────────────────────────────────────────────────┐
│  Frontend: Vercel / Netlify                    │
│  - Automatic deployments from Git              │
│  - Global CDN                                  │
│  - Serverless functions                        │
└────────────────────────────────────────────────┘
                    ↕ API calls
┌────────────────────────────────────────────────┐
│  Backend: Railway / Render / Fly.io            │
│  - Managed FastAPI hosting                     │
│  - Auto-scaling                                │
│  - Built-in CI/CD                              │
└────────────────────────────────────────────────┘
                    ↕ Database connection
┌────────────────────────────────────────────────┐
│  Database: Supabase / Neon / PlanetScale       │
│  - Managed PostgreSQL                          │
│  - Connection pooling                          │
│  - Backups & point-in-time recovery            │
└────────────────────────────────────────────────┘
                    ↕ Object storage
┌────────────────────────────────────────────────┐
│  Files: AWS S3 / Cloudflare R2                 │
│  - Resume uploads                              │
│  - Profile pictures                            │
│  - CDN delivery                                │
└────────────────────────────────────────────────┘
```

---

## 🚀 Development Workflow

### Local Development Setup

```
Developer Machine
│
├── Terminal 1: Backend
│   cd backend
│   .\venv_fresh\Scripts\activate
│   uvicorn app.main:app --reload --port 8000
│   → http://localhost:8000
│
├── Terminal 2: Frontend
│   cd frontend
│   npm run dev
│   → http://localhost:5173
│
└── Browser
    → Access frontend at localhost:5173
    → API docs at localhost:8000/docs
```

### Git Workflow

```
main branch (production-ready)
    ↑
develop branch (integration)
    ↑
feature/your-feature branch
    │
    ├── Make changes
    ├── Test locally
    ├── Commit changes
    └── Create Pull Request
```

---

## 📊 System Boundaries

### Internal vs External

```
┌──────────────────────────────────────────────┐
│            YOUR SYSTEM BOUNDARY              │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Frontend (React)                      │ │
│  │  Backend (FastAPI)                     │ │
│  │  Database (SQLite → PostgreSQL)        │ │
│  │  File Storage                          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  External Dependencies:                      │
│  ┌────────────────┐  ┌────────────────────┐ │
│  │  Gemini API    │  │  SMTP Email Svc    │ │
│  │  (Google)      │  │  (Gmail)           │ │
│  └────────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 🎯 Key Architectural Decisions

### Why SQLite? (For Now)
✅ **Pros:**
- Zero configuration
- Perfect for development
- Single file database
- Great for <100 concurrent users

❌ **Cons:**
- No concurrent writes
- Not suitable for production scale
- Limited to single server

**Migration Path**: SQLite → PostgreSQL when scaling

### Why FastAPI?
✅ **Pros:**
- Automatic OpenAPI docs
- Async support
- Type safety with Pydantic
- High performance
- Easy to learn

### Why React + Vite?
✅ **Pros:**
- Fast development experience
- Hot module replacement
- Large ecosystem
- Component reusability
- Easy deployment (static files)

### Why Zustand for State?
✅ **Pros:**
- Minimal boilerplate
- TypeScript friendly
- Small bundle size
- Easy to use

---

## 🔮 Evolution Roadmap

### Phase 1: Current (MVP)
- ✅ Core functionality working
- ✅ AI mock interviews
- ✅ Basic authentication
- ⚠️ SQLite database

### Phase 2: Production Ready (Next)
- [ ] PostgreSQL migration
- [ ] Comprehensive testing
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] Monitoring setup

### Phase 3: Scale (Future)
- [ ] Caching layer (Redis)
- [ ] Microservices split
- [ ] Message queue (RabbitMQ/Celery)
- [ ] Container orchestration (Kubernetes)
- [ ] Multi-region deployment

---

**Quick Access:**
- Full Architecture: See `ARCHITECTURAL_DESIGN.md`
- Repository: https://github.com/Roshan9010/Selector-Applicant-Simulator
- API Docs: http://localhost:8000/docs
