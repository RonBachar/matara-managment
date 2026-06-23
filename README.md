# Matara Management

Matara Management is a full-stack internal management system for a web or design studio. It brings together leads, clients, projects, tasks, and project briefs in one place.

## Main Idea

The product is built around the workflow:

`Lead -> Client -> Project -> Project Brief -> Tasks`

Instead of managing this flow across spreadsheets and notes, the app centralizes it in a single system.

## What The App Does

- Manage leads and convert them into clients
- Manage clients and recurring client services
- Track projects, statuses, notes, and financial fields
- Manage tasks in a kanban-style workflow
- Generate and store project briefs tied to projects

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- Prisma

### Database

- PostgreSQL
- Docker Compose for local development

## Repository Structure

- `frontend/` - React application
- `backend/` - Express API and Prisma setup
- `docs/` - architecture and project notes

## Current Architecture Notes

- The backend is the source of truth for migrated modules
- Projects are database-backed
- Clients are database-backed
- Project briefs are in transition and are being aligned around a one-brief-per-project model
- Local development depends on PostgreSQL running locally through Docker

## Local Development

### 1. Start Docker / PostgreSQL

From the project root:

```powershell
docker compose up -d
```

### 2. Configure backend environment

Make sure `backend/.env` contains:

```env
DATABASE_URL="postgresql://matara:matara@localhost:5432/matara?schema=public"
```

### 3. Run database migrations

```powershell
cd backend
npm run db:migrate
```

### 4. Start the backend

```powershell
cd backend
npm run dev
```

Backend runs on `http://localhost:3000`.

### 5. Start the frontend

```powershell
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 6. Optional: open Prisma Studio

```powershell
cd backend
npm run db:studio
```

## Important Note

If Docker or PostgreSQL is not running, the backend can start, but database-backed features will fail.
