# Backend (Express + MongoDB)

Backend API for the Job Portal project.

## Tech
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT auth

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` values:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV`

## Run
- Dev:
  ```bash
  npm run dev
  ```
- Prod:
  ```bash
  npm start
  ```

Server default: `http://localhost:5000`
Health check: `GET /api/health`

## Seed data
```bash
npm run seed
```

## Important
- Never commit `.env`.
- Keep `JWT_SECRET` strong in production.
