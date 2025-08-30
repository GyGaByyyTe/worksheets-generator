# Local Development Setup on Windows (PowerShell)

This guide shows how to clone, configure, and run the project locally on Windows 10/11 using PowerShell.

The project is a pnpm monorepo with:
- @wg/web — Next.js app (port 3000)
- @wg/server — Express API (port 4000), stores generated results in PostgreSQL via Prisma
- @wg/core — generation logic library

Anonymous mode is supported (you can generate without logging in), but the backend requires a PostgreSQL database (DATABASE_URL) to run.

---

## 1) Prerequisites
- Windows 10/11
- PowerShell (run as a normal user)
- Git for Windows: https://git-scm.com/download/win
- Node.js 18+ (recommended 22 LTS for Next.js 15/React 19)

Install Node.js (22 LTS recommended):
- Download and install from https://nodejs.org/en/download
- Then verify:

```powershell
node -v
npm -v
```

Enable Corepack and activate pnpm:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

## 2) PostgreSQL on Windows
You need a local PostgreSQL server. Two common options:

A) Installer (simple):
- Download Windows installer from https://www.postgresql.org/download/windows/
- Install PostgreSQL 15/16, remember the postgres superuser password.

B) Docker Desktop (alternative):
- Install Docker Desktop
- Run a postgres container (replace dev_password):

```powershell
docker run --name wg-postgres -e POSTGRES_PASSWORD=dev_password -p 5433:5432 -d postgres:16
```

Create a database and user (works for both local install and Docker):

1) Open "SQL Shell (psql)" or use psql from PowerShell:
```powershell
psql -U postgres -h 127.0.0.1 -p 5433
psql -U dev_user -p 5433 -h 127.0.0.1 -d wg_dev
```
2) In psql, run:
```sql
CREATE USER dev_user WITH PASSWORD 'dev_password';
CREATE DATABASE wg_dev OWNER dev_user;
GRANT ALL PRIVILEGES ON DATABASE wg_dev TO dev_user;
```

## 3) Clone the repository
```powershell
cd E:\projects\portfolio
git clone https://github.com/<your-org-or-user>/worksheets-generator.git
cd .\worksheets-generator
```

## 4) Set environment variables (PowerShell session)
Set DATABASE_URL for the backend (@wg/server). You can paste this into the same terminal before running dev.

```powershell
$env:DATABASE_URL = "postgresql://dev_user:dev_password@127.0.0.1:5433/wg_dev?schema=public"
# Optional (recommended to change):
$env:JWT_SECRET = "dev-secret-change-it"
```

Notes:
- These env vars apply to the current PowerShell session. Re-run them in new terminals.
- The web app by default points to http://localhost:4000, so you usually don’t need to set NEXT_PUBLIC_API_URL locally. If needed:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000"
```

## 5) Install dependencies
From the repo root:
```powershell
pnpm install
```

## 6) Initialize the database schema (Prisma)
Once DATABASE_URL is set, generate the Prisma client and apply the schema:
```powershell
pnpm --filter @wg/server prisma:generate
pnpm --filter @wg/server prisma:push
```

This creates the required tables (users, generations, pages).

## 7) Start development servers
Option A: Run both in parallel (convenient):
```powershell
pnpm dev
```
- API server: http://localhost:4000
- Web app: http://localhost:3000

Option B: Run in separate terminals:
- Terminal 1 (with env vars set):
```powershell
pnpm dev:server
```
- Terminal 2:
```powershell
pnpm dev:web
```

## 8) Verify
- API health: open http://localhost:4000/health
- Web UI: open http://localhost:3000
- From the web UI, select tasks and generate. The result should show links like:
  - /files/<pageId>
  - /generations/<genId>/day/<n>/index.html

## 9) Optional: Authentication
Auth is optional. To try it:

- Register:
```powershell
# PowerShell example using curl
curl -Method Post -Uri http://localhost:4000/auth/register -ContentType "application/json" -Body '{"email":"test@example.com","password":"secret123"}'
```
- Login to get token:
```powershell
curl -Method Post -Uri http://localhost:4000/auth/login -ContentType "application/json" -Body '{"email":"test@example.com","password":"secret123"}'
```
Use the returned token as an Authorization header: "Bearer <token>" when calling private endpoints (generation supports anonymous, so token is optional).

## 10) Troubleshooting
- Error: "Environment variable not found: DATABASE_URL"
  - Ensure you set $env:DATABASE_URL in the same terminal where you run pnpm dev/dev:server.
- Error: "Prisma Client initialization" or missing tables
  - Run prisma steps again: pnpm --filter @wg/server prisma:generate && pnpm --filter @wg/server prisma:push
- Port already in use
  - Check ports 3000 and 4000, stop other apps or change PORT (e.g., $env:PORT = "5000" for server before pnpm dev:server).
- PostgreSQL connection refused
  - Ensure Postgres is running and reachable on 127.0.0.1:5433. Verify credentials.

You’re ready to develop on Windows!