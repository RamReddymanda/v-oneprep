# AeroPath Academy MVP - Project Handoff

## Current Status

This workspace contains a greenfield AeroPath Academy MVP monorepo.

Root: `D:\New folder`

Implemented apps:

- `apps/web`: Next.js 15 App Router frontend, TypeScript, TailwindCSS, shadcn-style local UI primitives, TipTap editor.
- `apps/api`: NestJS REST API, TypeScript, Prisma client, PostgreSQL, JWT HttpOnly cookie auth.
- `packages/shared`: shared enums and DTO-style TypeScript types.

Current verified runtime:

- PostgreSQL is running in Docker as `aeropath-postgres`.
- Docker Postgres is exposed on host port `55432`, because local Windows PostgreSQL services already occupied `5432` and `5433`.
- Backend API is running on `http://localhost:4000/api`.
- Frontend is running on `http://localhost:3000`.
- `GET http://localhost:4000/api/plans` returned `200`.
- `GET http://localhost:3000` returned `200`.

Current server process IDs from this run:

- API: `node`, PID `34760`
- Web launcher: `cmd`, PID `9512`

These PIDs are only useful for the current machine/session.

## Demo Accounts

- Admin: `admin@aeropath.local` / `Admin@12345`
- Student: `student@aeropath.local` / `Student@12345`

Seed data includes:

- One admin user.
- One student user.
- One published DGCA Foundation plan.
- One published DGCA Ground School Foundation course.
- Air Regulations and Meteorology modules.
- Video, article, and assessment tasks.
- Rich article content stored as JSON.
- Assessment questions.
- A pre-created student purchase so the student can open the course immediately.

## Important Commands

Use `npm.cmd`, not `npm`, in PowerShell on this machine because PowerShell blocks `npm.ps1`.

Install dependencies:

```powershell
npm.cmd install
```

Start Postgres:

```powershell
docker compose up -d postgres
```

Generate Prisma client:

```powershell
npm.cmd run db:generate
```

Seed demo data:

```powershell
npm.cmd run db:seed
```

Build everything:

```powershell
npm.cmd run build
```

Run quality checks:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
```

Run backend API in production mode:

```powershell
cd apps\api
node.exe dist\src\main.js
```

Run frontend in production mode:

```powershell
cd apps\web
..\..\node_modules\.bin\next.cmd start --port 3000
```

Alternative development command:

```powershell
npm.cmd run dev
```

This starts both apps with `concurrently`, but it must stay open in the terminal. If the command is killed or times out, both servers stop.

## Environment Files

Created:

- `apps/api/.env`
- `apps/web/.env.local`

API database URL:

```env
DATABASE_URL="postgresql://aeropath:aeropath@127.0.0.1:55432/aeropath?schema=public"
```

Web API URL:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

The Docker Compose port mapping is:

```yaml
ports:
  - "55432:5432"
```

Reason: local machine already had other PostgreSQL listeners on `5432` and `5433`, so Prisma was accidentally reaching the wrong server and reported password/auth failures.

## What Was Built

Frontend routes:

- `/`
- `/login`
- `/signup`
- `/plans`
- `/dashboard`
- `/courses/[courseId]`
- `/learn/[taskId]`
- `/profile`
- `/admin`
- `/admin/courses`
- `/admin/plans`
- `/admin/users`

Backend route groups:

- Auth: signup, login, logout, current user.
- Public plans.
- Mock Razorpay checkout/success.
- Purchases.
- Courses and tasks.
- Progress completion.
- Assessment start and submit.
- Admin metrics.
- Admin course/module/task/plan/user/article/assessment/question management.
- Upload placeholder API for future S3 integration.

Database models:

- `User`
- `Account`
- `Plan`
- `Course`
- `Module`
- `Task`
- `Article`
- `Assessment`
- `Question`
- `AssessmentAttempt`
- `Answer`
- `Purchase`
- `Progress`
- `Payment`

Enums:

- `Role`
- `TaskType`
- `PublishStatus`
- `PaymentStatus`
- `QuestionType`

## Known Setup Notes

Prisma `migrate dev` and `db push` failed with an opaque `Schema engine error` in this environment.

To keep local setup working, a fallback SQL schema file was created:

```text
apps/api/prisma/init.sql
```

That SQL was applied directly inside the Docker Postgres container using:

```powershell
Get-Content -Raw -LiteralPath apps\api\prisma\init.sql | docker exec -i aeropath-postgres psql -U aeropath -d aeropath
```

After that, `npm.cmd run db:seed` worked successfully.

If a future agent wants proper Prisma migrations, investigate the local Prisma schema-engine issue and then replace the SQL fallback with a normal migration.

## Original Runtime Errors And Fixes

1. Docker initially failed because Docker Desktop was not running.

Fix: user started Docker Desktop, then `docker compose up -d postgres` worked.

2. Prisma seed failed with:

```text
Authentication failed against database server, the provided database credentials for `aeropath` are not valid.
```

Actual cause: host port `5432` was already owned by a native Windows `postgres` process, so Prisma was not connecting to the Docker database.

Fix: changed Docker Postgres host port to `55432` and updated `apps/api/.env`.

3. `next start` failed with:

```text
Could not find a production build in the '.next' directory.
```

Cause: `next start` only runs a production build; `.next/BUILD_ID` was missing.

Fix:

```powershell
npm.cmd run build -w @aeropath/web
```

Then:

```powershell
cd apps\web
..\..\node_modules\.bin\next.cmd start --port 3000
```

4. Nest watch mode failed with:

```text
EPERM: operation not permitted, unlink 'D:\New folder\apps\api\dist\prisma\seed.js'
```

Cause: Windows file permission/lock during watch-mode cleanup.

Workaround: run compiled API with:

```powershell
cd apps\api
node.exe dist\src\main.js
```

## Verification Already Completed

These passed after implementation:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Test suite currently includes a backend scoring unit test:

```text
apps/api/test/scoring.spec.ts
```

## Notes For Future Work

- Replace the SQL fallback with a proper Prisma migration once the local schema-engine issue is resolved.
- Add more backend API tests for auth, purchase unlocks, progress, admin routes, and assessment submission.
- Consider moving frontend API calls into server actions or route handlers if cookie handling needs stronger SSR behavior.
- Add real S3 upload implementation behind the existing upload abstraction.
- Replace mock Razorpay with real Razorpay order/payment verification.
- Run `npm audit` and decide dependency upgrade strategy. `npm install` reported transitive vulnerabilities after adding TipTap; do not run `npm audit fix --force` blindly because it may introduce breaking changes.
