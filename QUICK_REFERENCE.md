# 🎯 Quick Repository Reference Card

## Repository Information

**URL**: https://github.com/Roshan9010/Selector-Applicant-Simulator  
**Branch**: main  
**Latest Commit**: 3520811  
**Status**: ✅ Up to date with remote

---

## Quick Start Commands

### Clone the Repository
```bash
git clone https://github.com/Roshan9010/Selector-Applicant-Simulator.git
cd Selector-Applicant-Simulator
```

### Run the Application (Windows)
```powershell
.\start-app.ps1
```

Access at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Default Credentials

**Admin Login:**
- Email: admin@example.com
- Password: admin123

**Candidate Registration:**
- Create new account via /register

---

## Key Features

### AI Mock Interview ⭐ NEW!
- Real-time AI conversation
- Speech recognition & text-to-speech
- Performance analytics with scores
- Topic-based customization (16+ topics)
- Auto-submit on silence
- Draggable camera PIP
- Rate limit protection (HTTP 429 handling)

### Admin Dashboard
- Create job requirements
- View shortlisted candidates
- Manage exams
- Review interview reports

### Candidate Dashboard
- Profile registration
- Resume upload
- Mock interviews
- Exam participation
- Application tracking

---

## Tech Stack

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite Database
- JWT Authentication
- Gemini AI API

**Frontend:**
- React 18
- Vite (Build tool)
- TailwindCSS
- Zustand (State)
- Axios (HTTP)
- Lucide Icons

---

## Environment Setup

### 1. Create `.env` file in `backend/`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your-secret-key-here-change-this-in-production

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
INTERVIEW_LINK=https://your-app-domain.com/exam-room
```

### 2. Install Backend Dependencies:
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies:
```bash
cd frontend
npm install
```

---

## Development Workflow

### Make Changes
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request on GitHub

### Update from Remote
```bash
git pull origin main
```

### Check Status
```bash
git status
git log --oneline -5
```

---

## Important Directories

```
Web-based-applicant/
├── backend/
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── models.py     # Database models
│   │   ├── schemas.py    # Pydantic schemas
│   │   └── main.py       # FastAPI app
│   ├── venv_fresh/       # Python virtual env (ignored)
│   └── .env              # Environment variables (ignored)
├── frontend/
│   ├── src/
│   │   ├── pages/        # React page components
│   │   ├── components/   # Reusable components
│   │   ├── store/        # State management
│   │   └── App.jsx       # Main app
│   └── node_modules/     # Dependencies (ignored)
└── start-app.ps1         # Startup script
```

---

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Admin
- `GET /admin/candidates` - Get all candidates
- `POST /admin/requirements` - Create job requirement
- `GET /admin/shortlist` - Get shortlisted candidates

### Candidate
- `GET /candidate/profile` - Get profile
- `POST /candidate/profile` - Update profile
- `POST /candidate/resume` - Upload resume
- `GET /candidate/jobs` - View available jobs

### AI Features
- `POST /candidate/mock-interview` - Start AI interview
- `POST /candidate/mock-interview-report` - Generate report
- `POST /chat` - Chat with AI assistant

---

## Testing AI Mock Interview

1. **Login as candidate**
2. **Complete profile** (required)
3. **Click "Start 10-Min Practice"**
4. **Select topics** (e.g., Java, Python, React)
5. **Allow camera/mic access**
6. **Speak your answers** (auto-submits on silence)
7. **View performance report** after completion

**Note**: If you see HTTP 429 error, wait 10-15 seconds. The system handles this gracefully!

---

## Troubleshooting

### Backend won't start
```bash
# Activate venv and reinstall
cd backend
.\venv_fresh\Scripts\Activate.ps1
pip install -r requirements.txt --force-reinstall
```

### Frontend won't start
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database issues
```bash
# Reset database (WARNING: deletes all data)
cd backend
python populate_db.py
```

### API 429 Rate Limit
- Wait 10-15 seconds between requests
- System auto-recovers after rate limit resets
- See `API_RATE_LIMIT_INFO.md` for details

---

## File Exclusions (.gitignore)

These are NOT tracked by git:
- `.env` files (secrets)
- `*.db` (databases)
- `venv/`, `node_modules/` (dependencies)
- `*.log` (logs)
- `__pycache__/` (Python cache)
- `.DS_Store`, `Thumbs.db` (OS files)

---

## Documentation Files

- `README.md` - Main project documentation
- `API_RATE_LIMIT_INFO.md` - Rate limiting guide
- `GITHUB_DEPLOYMENT_SUMMARY.md` - Deployment details
- `QUICK_REFERENCE.md` - This file!

---

## Contact & Support

**Repository**: https://github.com/Roshan9010/Selector-Applicant-Simulator  
**Issues**: Use GitHub Issues tab  
**Discussions**: Use GitHub Discussions tab  

---

## License

(Add your license here - MIT recommended)

---

**Last Updated**: March 26, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
