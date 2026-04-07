# Architecture

## Repository structure
Project root:
- frontend/
- backend/
- docs/

## Frontend
Frontend stack:
- React
- Vite
- TypeScript

The frontend currently contains the real application UI and is gradually being migrated away from localStorage-based persistence.

## Backend
Backend stack:
- Node.js
- Express
- TypeScript

The backend provides API routes and is now the source of truth for migrated modules.

## Database
Database:
- PostgreSQL

Local development DB is run through Docker.

## ORM
ORM:
- Prisma

Prisma schema defines the main models and Prisma Studio is used to inspect actual stored data.

## Current data source status

### Projects
Projects are already database-backed.
This includes:
- list
- create
- edit
- delete
- status updates
- financial fields
- notes

### Clients
Clients are already database-backed.
This includes:
- list
- create
- edit
- delete

Important rule:
Clients do not have serviceType.
Service/work type belongs to Projects only.

### ProjectBriefs
ProjectBriefs are in transition / partially implemented.
The intended architecture is:

- Project is the main entity
- ProjectBrief belongs to Project
- one-to-one relationship
- one brief per project
- brief opened from Projects table
- create brief row only on first save

## Local development workflow
To work locally, all 3 parts must be running:

1. Docker / PostgreSQL
2. backend
3. frontend

Typical commands:

### Start DB
docker compose up -d

### Start backend
cd backend
npm run dev

### Start frontend
cd frontend
npm run dev

### Open Prisma Studio
cd backend
npm run db:studio

## Important note
If Docker/PostgreSQL is not running, backend/database features will not work correctly even if frontend and backend are both running.
