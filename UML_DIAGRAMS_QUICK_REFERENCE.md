# 📐 UML Diagrams Quick Reference

**Location**: [`UML_DIAGRAMS.md`](https://github.com/Roshan9010/Selector-Applicant-Simulator/blob/main/UML_DIAGRAMS.md)

---

## 🎯 Available Diagrams

### Class Diagrams (4 total)

| # | Diagram | Description | Section |
|---|---------|-------------|---------|
| 1 | **Complete System Class Diagram** | All entities, services, and relationships | [Section 1](#1-complete-system-class-diagram) |
| 2 | **Database Schema Class Diagram** | Database tables with columns and types | [Section 2](#2-database-schema-class-diagram) |
| 3 | **Backend API Router Classes** | FastAPI routers and middleware | [Section 3](#3-backend-api-router-classes) |
| 4 | **Frontend Component Classes** | React components and state management | [Section 4](#4-frontend-component-class-diagram) |

---

### Sequence Diagrams (8 total)

| # | Diagram | Actors Involved | Purpose |
|---|---------|-----------------|---------|
| 1 | **User Authentication** | User ↔ Frontend ↔ Backend ↔ DB | Login/signup flow |
| 2 | **AI Mock Interview** | Candidate ↔ UI ↔ Backend ↔ Gemini API | Complete interview conversation |
| 3 | **Resume Upload & Parsing** | Candidate ↔ UI ↔ Parser ↔ DB | File upload and NLP extraction |
| 4 | **Job Application** | Candidate ↔ UI ↔ Backend ↔ Email | Apply for positions |
| 5 | **Online Exam** | Candidate ↔ UI ↔ Backend | Take and submit exam |
| 6 | **Admin Shortlisting** | Admin ↔ UI ↔ Backend ↔ Email | Select candidates |
| 7 | **Password Reset** | User ↔ UI ↔ Backend ↔ OTP Store | Recover account |
| 8 | **AI Chatbot** | User ↔ Widget ↔ Backend ↔ Gemini | Help assistant |

---

### Activity Diagrams (2 total)

| # | Diagram | Type | Shows |
|---|---------|------|-------|
| 1 | **Candidate Registration Flow** | Decision Tree | Complete signup journey |
| 2 | **AI Mock Interview Decision Flow** | Complex Logic | Interview state machine |

---

### State Machine Diagrams (2 total)

| # | Diagram | Entity | States Tracked |
|---|---------|--------|----------------|
| 1 | **Application Status Lifecycle** | Job Application | Draft → Submitted → Review → Decision |
| 2 | **Exam State Transitions** | Exam | Not Started → Active → Submitted → Graded |

---

### Deployment Diagram (1 total)

| # | Diagram | Layers | Components |
|---|---------|--------|------------|
| 1 | **Multi-Layer Deployment** | Client, Frontend, Backend, Data, External | CDN, Load Balancer, API instances, DB, Cache, Storage, External APIs |

---

## 🔍 When to Use Each Diagram

### For Understanding System Structure
- ✅ **Class Diagram #1** - Overall system design
- ✅ **Class Diagram #2** - Database structure
- ✅ **Deployment Diagram** - Infrastructure layout

### For Understanding Behavior
- ✅ **Sequence Diagram #2** - AI interview flow
- ✅ **Sequence Diagram #3** - Resume processing
- ✅ **Activity Diagram #2** - Interview logic

### For Onboarding New Developers
1. Start with **Class Diagram #1** (big picture)
2. Review **Sequence Diagram #1** (auth basics)
3. Study **Deployment Diagram** (infrastructure)

### For Stakeholder Presentations
- ✅ **Activity Diagram #1** - User journey
- ✅ **Sequence Diagram #2** - AI features demo
- ✅ **State Machine #1** - Process transparency

### For Technical Documentation
- All **Class Diagrams** (complete specification)
- All **Sequence Diagrams** (interaction details)
- **State Machines** (lifecycle documentation)

---

## 📊 Diagram Complexity Levels

### Beginner Friendly 🟢
- Class Diagram #2 (Database Schema)
- Sequence Diagram #1 (Authentication)
- Activity Diagram #1 (Registration)

### Intermediate 🟡
- Class Diagram #3 (API Routers)
- Class Diagram #4 (Frontend)
- Sequence Diagram #4 (Job Application)
- Sequence Diagram #6 (Shortlisting)

### Advanced 🔴
- Class Diagram #1 (Complete System)
- Sequence Diagram #2 (AI Interview)
- Sequence Diagram #3 (Resume Parsing)
- State Machine Diagrams
- Deployment Diagram

---

## 🔗 Direct Links to Sections

### Class Diagrams
1. [Complete System Class Diagram](#1-complete-system-class-diagram)
2. [Database Schema Class Diagram](#2-database-schema-class-diagram)
3. [Backend API Router Classes](#3-backend-api-router-classes)
4. [Frontend Component Class Diagram](#4-frontend-component-class-diagram)

### Sequence Diagrams
1. [User Authentication](#1-user-authentication-sequence)
2. [AI Mock Interview](#2-ai-mock-interview-sequence)
3. [Resume Upload & Parsing](#3-resume-upload--parsing-sequence)
4. [Job Application](#4-job-application-sequence)
5. [Online Exam](#5-online-exam-sequence)
6. [Admin Shortlisting](#6-admin-shortlisting-sequence)
7. [Password Reset](#7-password-reset-sequence)
8. [AI Chatbot](#8-ai-chatbot-interaction-sequence)

### Activity Diagrams
1. [Candidate Registration Flow](#1-candidate-registration-flow)
2. [AI Mock Interview Decision Flow](#2-ai-mock-interview-decision-flow)

### State Machines
1. [Application Status Lifecycle](#1-application-status-lifecycle)
2. [Exam State Transitions](#2-exam-state-transitions)

### Deployment
1. [Multi-Layer Deployment](#deployment-diagram)

---

## 💡 How to Read These Diagrams

### Class Diagram Notation
```
┌─────────────┐
│  ClassName  │
├─────────────┤
│ +attribute  │  ← Public (+), Private (-)
│ -attribute  │
├─────────────┤
│ +method()   │  ← Return type after colon
│ -method()   │
└─────────────┘

Relationships:
──→ Association (uses)
──▷ Inheritance (extends)
──◇ Aggregation (has-a)
──◆ Composition (owns-a)
```

### Sequence Diagram Notation
```
Participant ->> Participant: Message
activate     deactivate
Note over Participant: Note
alt Condition
  Alternative path
else Other condition
  Other path
end
```

### State Machine Notation
```
[*] --> State: Transition
State --> [*]: End
State1 --> State2: Event trigger
```

---

## 🎨 Tools Used

All diagrams created using **Mermaid.js** syntax:
- Renders natively in GitHub Markdown
- Can be edited in any text editor
- Version controlled as code
- Auto-generates from specifications

### Mermaid Live Editor
To view/edit diagrams interactively:
https://mermaid.live/

Simply copy diagram code and paste!

---

## 📝 Updates & Maintenance

**Last Updated**: March 26, 2026  
**Version**: 1.0.0  
**Total Diagrams**: 17

### Future Additions Planned
- [ ] Component interaction diagrams
- [ ] Package diagrams
- [ ] Object diagrams
- [ ] Timing diagrams
- [ ] Communication diagrams

---

## 🔖 Citation

If referencing these diagrams:

```
Applicant Selector Simulator - UML Diagrams
Repository: https://github.com/Roshan9010/Selector-Applicant-Simulator
File: UML_DIAGRAMS.md
Accessed: [DATE]
```

---

**Quick Navigation:**
- Full Document: [`UML_DIAGRAMS.md`](https://github.com/Roshan9010/Selector-Applicant-Simulator/blob/main/UML_DIAGRAMS.md)
- Architecture Guide: [`ARCHITECTURE_VISUAL_GUIDE.md`](https://github.com/Roshan9010/Selector-Applicant-Simulator/blob/main/ARCHITECTURE_VISUAL_GUIDE.md)
- Main Architecture: [`ARCHITECTURAL_DESIGN.md`](https://github.com/Roshan9010/Selector-Applicant-Simulator/blob/main/ARCHITECTURAL_DESIGN.md)
