# AeroPath Academy MVP

Premium DGCA ground-school MVP for Indian CPL/ATPL aspirants.

## Apps

- `apps/web`: Next.js 15 App Router frontend.
- `apps/api`: NestJS REST API with Prisma and PostgreSQL.
- `packages/shared`: shared enums and DTO types.

## Local Setup

PowerShell on this machine blocks `npm.ps1`, so use `npm.cmd`.

```powershell
npm.cmd install
docker compose up -d postgres
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:4000/api

## Demo Accounts

- Admin: `admin@aeropath.local` / `Admin@12345`
- Student: `student@aeropath.local` / `Student@12345`

## Quality Gates

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```
