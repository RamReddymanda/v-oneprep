# AeroPath Academy MVP Build Plan

## Summary
Build a greenfield npm-workspaces monorepo in `d:\New folder` with:

- `apps/web`: Next.js 15 App Router, TypeScript, TailwindCSS, shadcn/ui.
- `apps/api`: NestJS, Prisma, PostgreSQL, JWT HttpOnly cookie auth.
- `packages/shared`: shared TypeScript DTOs/enums used by both apps.
- `docker-compose.yml`: local PostgreSQL for development and demos.
- Seeded demo data so the full admin-to-student flow works without manual DB edits.

Use `npm.cmd` commands on this Windows machine because PowerShell blocks `npm.ps1`.

## Key Changes
- Create polished responsive web UI for `/`, `/plans`, `/dashboard`, `/courses/[courseId]`, `/learn/[taskId]`, `/profile`, `/admin`, `/admin/courses`, `/admin/users`, and `/admin/plans`.
- Implement backend REST APIs for auth, courses, modules, tasks, articles, assessments, progress, plans, purchases, payments, users, and admin metrics.
- Use Prisma models: `User`, `Account`, `Plan`, `Course`, `Module`, `Task`, `Article`, `Assessment`, `Question`, `AssessmentAttempt`, `Answer`, `Purchase`, `Progress`, `Payment`.
- Store article content as TipTap/ProseMirror JSON in PostgreSQL, not PDFs.
- Add S3-compatible upload abstraction with local placeholder behavior when S3 credentials are missing.
- Add mock Razorpay flow: buy plan, open modal, confirm success, create payment + purchase, unlock courses.
- Add role-based access: `STUDENT` and `ADMIN`.
- Seed:
  - Admin user: `admin@aeropath.local`
  - Student user: `student@aeropath.local`
  - One DGCA plan, one published course, modules, video/article/assessment tasks, questions, and existing purchase for demo testing.

## Public Interfaces
- Auth:
  - `POST /auth/signup`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/me`
- Plans and purchase:
  - `GET /plans`
  - `POST /payments/mock-checkout`
  - `POST /payments/mock-success`
  - `GET /purchases/me`
- Learning:
  - `GET /courses`
  - `GET /courses/:courseId`
  - `GET /tasks/:taskId`
  - `POST /progress/:taskId/complete`
  - `POST /assessments/:assessmentId/start`
  - `POST /assessments/:assessmentId/submit`
- Admin:
  - `GET /admin/metrics`
  - CRUD routes for courses, modules, tasks, plans, users, assessments, questions.
- Shared enums:
  - `Role = STUDENT | ADMIN`
  - `TaskType = VIDEO | ARTICLE | ASSESSMENT`
  - `PublishStatus = DRAFT | PUBLISHED`
  - `PaymentStatus = MOCK_SUCCESS | MOCK_FAILED`
  - `QuestionType = MCQ | FILL_BLANK`

## Test Plan
- Backend:
  - Unit tests for auth validation, password hashing, role guards, mock purchase creation, progress calculation, assessment scoring, and timeout auto-submit behavior.
  - API tests for signup/login, course unlock rules, admin-only routes, assessment submit, and seeded demo flow.
- Frontend:
  - TypeScript build with no errors.
  - Responsive checks for 320px, 375px, 768px, 1024px, and 1440px.
  - Verify no horizontal scroll, no hydration errors, no dead CTAs, and working mobile learning drawer.
- End-to-end demo:
  - Admin logs in, creates/publishes course content, creates plan, assigns course.
  - Student signs up, buys plan through mock Razorpay, opens dashboard, watches video, reads article, takes assessment, views score, and sees progress/profile updates.
- Quality gates:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run test`
  - `npm.cmd run build`

## Assumptions
- Use Docker Postgres locally and Neon PostgreSQL in production.
- Use deploy-ready configuration for Vercel frontend and Render/Railway backend.
- Use REST APIs, not GraphQL.
- Forgot password link is visible but reset flow is not implemented in this MVP.
- OAuth is database-ready through an `Account` model, but Google/LinkedIn login is not implemented yet.
- Vimeo lessons use embedded URLs; video completion is stored when the student clicks “Mark complete.”
- S3 is abstracted behind upload APIs, but the MVP still works locally without real AWS credentials.
