# AI Applicant Selector

A full-stack Web Application designed to help HR teams (Admins) filter and shortlist candidates, along with providing an AI Assistant Chatbot and an Online Secure Exam module.

## Features
1. **Role-based Auth:** separate routes and logic for Admins and Candidates.
2. **AI Chatbot:** A fully functional floating chat widget on the frontend supporting conversational recruitment flows.
3. **Admin Dashboard:** Create new Job Requirements and review ranked candidates.
4. **Candidate Dashboard:** Robust registration system with Resume Upload processing.
5. **Secure Exam System:** Anti-cheat proctoring logic leveraging webcam access, full-screen verification, restricted tab switching, and keyboard shortcut blocking.

## Setup Instructions

### 1. Prerequisites
You need to install the following on your system:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/downloads/) (v3.9 or higher)

### 2. Backend Setup (FastAPI)
1. Open a terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # Depending on OS:
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   # source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will be running at http://localhost:8000*
   *Automatic DB Creation happens on startup using SQLite.*

### 3. Frontend Setup (React/Vite)
1. Open a new terminal and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at http://localhost:5173*

## Mock Data / Test Users
1. Register a new user and select "Admin (HR Manager)" to view the Admin Dashboard and create a job opening.
2. In a different browser tab or via incognito, register a user and select "Candidate (Job Applicant)".
3. Fill out the candidate form and click Submit.
4. As an Admin, you will see the Candidate ranked.
5. As a Candidate, you will be shortlisted to enter the Proctored Exam Room.

## Proctored Exam Tips
The system will monitor camera and tab switches. Pressing "Accept & Start" will ask for camera permission and enter Full-Screen mode.
If you switch tabs 3 times, the system will auto-submit.

## Technologies Used
- **Frontend**: React, Zustand, Axios, React-Router-Dom, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic, Passlib, JWT Auth, Python.
