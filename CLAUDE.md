# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `erefs-app/`.

**Start both frontend and backend (development):**
```bash
npm run dev
```

**Run backend only:**
```bash
npm run dev --workspace=backend   # nodemon on port 4000
```

**Run frontend only:**
```bash
npm run dev --workspace=frontend  # Vite on port 5173
```

**Run all backend tests:**
```bash
cd erefs-app/backend && npm test
```

**Run a single test file:**
```bash
cd erefs-app/backend && npx jest tests/routes/referrals.test.js
```

**Run tests in watch mode:**
```bash
cd erefs-app/backend && npm run test:watch
```

**Install all dependencies (first time):**
```bash
cd erefs-app && npm run install:all
```

## Architecture

This is an npm workspaces monorepo under `erefs-app/` with two packages: `frontend` and `backend`.

### Backend (`erefs-app/backend/`)

Express.js API on port 4000, CommonJS modules (`require`/`module.exports`).

- `src/app.js` — Express app setup and route mounting. Imported by `src/index.js` (which starts the server and cron).
- `src/db.js` — Single `pg.Pool` connected via `DATABASE_URL`. Used directly in all route files.
- `src/middleware/auth.js` — JWT verification middleware. Sets `req.user = { id, role, name, is_admin }`.
- `src/routes/` — One file per domain. All routes requiring auth import the auth middleware; role checks are inline (`req.user.role !== 'employer'`).
- `src/services/llm.js` — Calls Groq API (`llama-3.3-70b-versatile` by default, overridden by `LLM_MODEL` env var) via the Vercel AI SDK (`ai` package). Triggered after a referrer submits their form; generates and upserts one report per referrer into the `reports` table.
- `src/services/email.js` — Wraps Resend. In dev (no `RESEND_API_KEY`), all sends are no-ops that log the URL to console.
- `src/services/reminders.js` — `node-cron` job running daily at 08:00 to send one reminder email per pending referrer once they cross the `user.reminder_days` threshold.
- `src/db/schema.sql` — Source of truth for the DB schema. Migrations in `src/db/migrations/` are numbered sequentially and must be applied manually.

### Frontend (`erefs-app/frontend/`)

React 18 + Vite, ES modules. Tailwind CSS for styling. No state management library.

- `src/App.jsx` — All routes defined here. `PrivateRoute` wrapper handles auth guard and role/admin restrictions.
- `src/context/AuthContext.jsx` — Global auth state. User object (`{ id, email, name, role, company, is_admin }`) persisted in `localStorage` as `erefs_user`; JWT stored as `erefs_token`.
- `src/api.js` — Axios instance with base URL from `VITE_API_URL` env var (empty = use Vite proxy). Attaches JWT from localStorage on every request.
- `src/pages/` — Page-level components, one per route.

### User Roles

There are two user roles (`jobseeker` and `employer`) plus an `is_admin` flag:
- `jobseeker` → `/dashboard` (Dashboard.jsx) — creates referral requests for themselves.
- `employer` → `/employer/dashboard` (EmployerDashboard.jsx) — manages a candidate pipeline.
- `is_admin` → `/admin` (AdminDashboard.jsx) — platform-wide oversight, no role restriction on their account.

When linking back to "Dashboard" from inner pages, always use the role-aware pattern:
```js
const dashboardPath = user?.role === 'employer' ? '/employer/dashboard' : '/dashboard';
```

### Core Data Flow

1. A requester creates a referral request → referrers are inserted → invite emails sent with a unique `token` UUID link.
2. A referrer visits `/ref/:token` (public) → submits 10 answers.
3. On submit, `generateReport(referrerId)` is called async — it queries Groq and upserts into `reports`.
4. The requester sees "View Report" on the detail page once `report_id` is populated.
5. Reports have a `share_token` for a public read-only URL at `/report/share/:shareToken`.

### Environment Variables

**Backend** (`erefs-app/backend/.env`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
GROQ_API_KEY=...
LLM_MODEL=llama-3.3-70b-versatile   # optional
RESEND_API_KEY=...
EMAIL_FROM=...
FRONTEND_URL=http://localhost:5173   # comma-separated for multiple origins
PORT=4000
```

**Frontend** (`erefs-app/frontend/.env`):
```
VITE_API_URL=   # leave empty locally; Vite proxies /api → localhost:4000
```

### Testing

Backend tests only (no frontend tests). Uses Jest + Supertest. Tests mock the `pg` pool and external services (`llm.js`, `email.js`) with `jest.mock`. `tests/helpers.js` provides `makeToken()`, `makeAdminToken()`, `authHeader()`, and `mockDbClient()` utilities. `tests/setup.js` sets required env vars before any test file loads.
