# TalentDesk Backend

Backend API for TalentDesk built on Express + MongoDB + Socket.IO.

## 1) Responsibility
This service handles:
- Auth and user profile APIs
- Company and job posting APIs
- Job application lifecycle APIs
- Recruiter-applicant chat + presence via WebSocket
- Resume/logo file uploads

## 2) Core Domain Models
- User
  - role: `job_seeker | recruiter | admin`
  - profile fields + resume URL
  - chat block-list support
- Company
  - recruiter-owned company metadata
- Job
  - role, salary, experience, type/work mode
  - recruiter contact fields: email, phone, address
  - immediate-joiner requirement flag
- Application
  - applicant ↔ recruiter mapping per job
  - resume URL, cover letter, status
- Conversation / Message
  - real-time messaging
  - block/archive/delete states

## 3) Important API Groups
- `/api/auth`
  - register/login/me
  - profile update
  - resume upload
- `/api/jobs`
  - list, detail, create, update, delete
  - companies create/list
  - company logo upload
- `/api/applications`
  - create/list/update/delete
- `/api/messages`
  - conversations and chat actions
  - block/archive/read/delete operations
- `/api/notifications`
  - notification listing and read state

## 4) Recruiter Workflow Coverage
- Create company
- Post job with required contact details
- Receive job applications
- Open applicant profile details and resume
- Move candidate through hiring statuses
- Chat with candidate in real time

## 5) Local Setup
1. Install dependencies
```bash
npm install
```

2. Create env file
```bash
cp .env.example .env
```

3. Set env values
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV`

4. Run backend
```bash
npm run dev
```

Server default URL: `http://localhost:5000`
Health endpoint: `GET /api/health`

## 6) Seed Script
```bash
npm run seed
```

## 7) WebSocket Events (High Level)
- `join:user`
- `join:conversation`
- `message:new`
- `conversation:updated`
- `conversation:read`
- `presence:users`

## 8) Security Notes
- Never commit `.env`.
- Use strong `JWT_SECRET` in production.
- Restrict CORS origin in production (currently broad for local development convenience).
