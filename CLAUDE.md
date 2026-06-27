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
- `src/middleware/auth.js` — JWT verification middleware. Required; returns 401 if no/invalid token. Sets `req.user = { id, role, name, is_admin }`.
- `src/middleware/optionalAuth.js` — Identifies the user if a valid token is present but never blocks the request. Used on public routes that behave differently when the caller happens to be logged in (e.g. showing "already applied" state on Open Roles).
- `src/routes/` — One file per domain. All routes requiring auth import `auth`; role checks are inline (`req.user.role !== 'employer'`).
- `src/routes/auth.js` — Email/password login + registration, Google OAuth (`POST /api/auth/google`), and LinkedIn OAuth (`GET /api/auth/linkedin` → `GET /api/auth/linkedin/callback` → `POST /api/auth/linkedin/complete`). Both OAuth flows verify the provider token/code server-side, link to existing accounts by email, and route brand-new users through a role-select page (`GoogleRoleSelect.jsx` / `LinkedInRoleSelect.jsx`) before creating their account. **LinkedIn only ever provides name, email, and profile photo** (the "Sign In with LinkedIn using OpenID Connect" tier) — work history, skills, and connections require LinkedIn's restricted Partner Programme and are not available. `GET /api/auth/linkedin` returns 503 with `"LinkedIn sign-in is not configured on this server."` if `LINKEDIN_CLIENT_ID` is unset.
- `src/routes/referrers.js` — Public token-based routes (no auth): `GET /api/referrers/:token` (loads form + marks `viewed`), `POST /api/referrers/:token/submit`, `POST /api/referrers/:token/decline`, `POST /api/referrers/:token/call-request`.
- `src/routes/candidateProfile.js` — Public token-based routes for the **candidate self-report flow** (employer flow only — see below): `GET /api/candidate-profile/:token`, `POST /api/candidate-profile/:token/submit`. On submit, triggers `generateProfileAnalysis` (in `services/linkedin.js`) async.
- `src/routes/employer.js` — Employer-only routes: candidate pipeline (`/candidates`), job postings (`/jobs`, including edit/delete/expiry/Flash Job request), applicants per job (`/jobs/:id/applicants`), and the Talent Pool directory + brokered contact (`/talent`, `/talent/:vmId/contact`).
- `src/routes/talent.js` — `GET /api/talent` — fully public, paginated, anonymized Talent Pool listing (no auth). Contacting a candidate still requires a logged-in employer account (handled under `/api/employer/talent`).
- `src/routes/jobs.js` — `GET /api/jobs` (public Open Roles browse, paginated, `optionalAuth`), `GET /api/jobs/flash` (public, top 5 active Flash Jobs for the home page), `POST /api/jobs/:id/apply` (jobseeker-only, auth required).
- `src/routes/admin.js` — Platform-wide admin routes, all gated by `adminOnly` (inline middleware checking `req.user.is_admin`). Includes the Flash Job payment-confirmation queue (`/flash-requests`, `/flash-requests/:id/activate`, `/flash-requests/:id/decline`).
- `src/services/llm.js` — Calls Groq API (`llama-3.3-70b-versatile` by default, overridden by `LLM_MODEL` env var) via the Vercel AI SDK (`ai` package). Triggered only when a referrer's status is set to `completed`; generates and upserts one report per referrer into the `reports` table. Sets `share_token_expires_at` on the report from the requester's `share_link_expiry_days` setting (default 14).
- `src/services/linkedin.js` — Despite the filename (predates a pivot), this no longer talks to LinkedIn or any scraping API — Proxycurl (the original provider) shut down in 2026 after a LinkedIn lawsuit over unauthorized scraping. It now analyzes a candidate's **self-reported** professional summary via the LLM. Employer-flow only.
- `src/services/email.js` — Wraps Resend. In dev (no `RESEND_API_KEY`), all sends are no-ops that log to console. Includes invite, reminder, password reset, verification, candidate-profile invite, employer-contact-request (Talent Pool), and new-applicant-notification (Open Roles) emails. The latter two CC everyone in `ADMIN_REPORT_EMAILS`.
- `src/services/reminders.js` — `node-cron` job running daily at 08:00 to send one reminder email per referrer in `invited` or `viewed` status once they cross the `user.reminder_days` threshold. After the loop, sends a summary report to `ADMIN_REPORT_EMAILS`.
- `src/db/schema.sql` — Source of truth for the original schema. Migrations in `src/db/migrations/` are numbered sequentially (currently through `018`) and must be applied manually. **Note:** there are two files both numbered `011` (`011_linkedin_oauth.sql` and `011_resume_link.sql`) — a known duplicate-number gap, left as-is; both are safe to run, just not in strict numeric lockstep.

### Frontend (`erefs-app/frontend/`)

React 18 + Vite, ES modules. Tailwind CSS for styling. No state management library.

- `src/App.jsx` — All routes defined here. `PrivateRoute` wrapper handles auth guard and role/admin restrictions. Some routes are intentionally public even though they show personalized state when logged in (e.g. `/talent`, `/jobs`) — they use `useAuth()` directly rather than `PrivateRoute`.
- `src/context/AuthContext.jsx` — Global auth state. User object persisted in `localStorage` as `erefs_user`; JWT stored as `erefs_token`.
- `src/api.js` — Axios instance with base URL from `VITE_API_URL` env var (empty = use Vite proxy). Attaches JWT from localStorage on every request.
- `src/components/Pagination.jsx` — Shared Previous/Next pagination control, used by the Talent Pool, Open Roles, and the employer-side equivalents.
- `src/utils/url.js` — `normalizeUrl()` prepends `https://` to bare-domain URLs (e.g. LinkedIn/resume links) so browser `type="url"` validation and `<a href>` both work even when a user pastes a domain without a scheme.
- `src/pages/` — Page-level components, one per route.

### User Roles

There are two user roles (`jobseeker` and `employer`) plus an `is_admin` flag:
- `jobseeker` → `/dashboard` (Dashboard.jsx) — creates referral requests for themselves. Lightweight flow: Reference Check + an optional resume link. No professional/background verification.
- `employer` → `/employer/dashboard` (EmployerDashboard.jsx) — manages a candidate pipeline, job postings, and the Talent Pool.
- `is_admin` → `/admin` (AdminDashboard.jsx) — platform-wide oversight, no role restriction on their account. Also handles the Flash Job payment queue.

When linking back to "Dashboard" from inner pages, always use the role-aware pattern:
```js
const dashboardPath = user?.role === 'employer' ? '/employer/dashboard' : '/dashboard';
```

### Core Data Flow — Reference Check

1. A requester creates a referral request → referrers are inserted → invite emails sent with a unique `token` UUID link. Emails include "Decline" and "Request a Call" links, and a reminder note if `reminder_days > 0`.
2. A referrer visits `/ref/:token` (public) → status auto-updates to `viewed`. They can submit the form (`completed`), click Decline (`declined`), or click Request a Call (`call_requested`).
3. On submit, `generateReport(referrerId)` is called async — it queries Groq and upserts into `reports`, with a `share_token_expires_at` computed from the requester's `share_link_expiry_days` setting.
4. The requester sees enriched status badges per referrer on the detail page (`ReferralDetail.jsx`). "View Report" appears once `report_id` is populated.
5. Reports have a `share_token` for a public read-only URL at `/report/share/:shareToken` (expires per above). If a request has 2+ completed reports, a **combined share link** (`referral_requests.share_token`, route `/referrals/share/:shareToken`) lets the candidate share all reports at once instead of separately.

### Candidate Self-Report Flow (Professional Check — employer flow only)

When an **employer** creates a referral request with a `candidateEmail`, a `candidate_token` is generated and `sendCandidateProfileInvite` emails the candidate a link to `/candidate/:token` (public, no login). The candidate can optionally write a free-text professional summary in their own words — this is never scraped or auto-extracted, only self-reported. On submit, the LLM (`services/linkedin.js`) turns it into a structured "Professional Profile" section (`referral_requests.linkedin_analysis_json`) shown on `ReferralDetail.jsx` and the report views, with an explicit disclaimer that it's self-reported and not independently verified. **Jobseeker-created requests never trigger this** — jobseekers only get the lightweight resume-link flow.

### Talent Pool (anonymized jobseeker directory)

Jobseekers opt in via two Settings toggles: `publicly_discoverable` (show headline + reference-complete status) and `allow_employer_contact` (premium-ish — allow brokered outreach; not currently paywalled). Every user has a `vm_id` (auto-generated by a DB trigger on insert, format `VM-XXXXXX`) — **this is the only identifier ever exposed publicly**; raw user UUIDs never appear in Talent Pool API responses.

- `GET /api/talent` — fully public, no login, paginated (20/page).
- `/employer/talent` (authenticated) — same listing plus `already_contacted` per candidate.
- `POST /api/employer/talent/:vmId/contact` (employer auth) — one request per employer/jobseeker pair (unique constraint on `contact_requests`). Sends the **employer's** name/email/phone to the jobseeker via email — the jobseeker's contact info is never exposed to the employer unless they reply. CCs `ADMIN_REPORT_EMAILS`.

### Open Roles (job board) + Flash Jobs (paid featured placement)

Employers post jobs (`jobs` table — pre-existing `title`/`description`/`status`, extended with `location`, `work_requirement`, `is_public`, `expires_at`). Viewing is **fully public, no login** (`GET /api/jobs`, `optionalAuth`); only **Apply** requires a logged-in jobseeker account, and disclosure is the normal job-application kind (employer sees the applicant's real name/email/resume — not brokered). One application per jobseeker per job (unique constraint on `job_applications`). Deleting a job cascades to its applications.

**Flash Jobs** are a paid upsell on top of a regular posting — featured placement on the home page. No payment processor is wired up; it's manual/invoice-based: employer requests Flash (`jobs.flash_status = 'pending_payment'`) → admin confirms payment was received externally and activates it from `AdminDashboard.jsx`'s queue (`flash_status = 'active'`, `flash_expires_at = now + 7 days`) → `GET /api/jobs/flash` shows the 5 most-recently-activated Flash Jobs on the home page (no rotation cron — the 6th-oldest simply drops out of the top-5 query once a new one activates).

### Referrer Status Machine

| Status | Trigger |
|---|---|
| `invited` | Default on insert |
| `viewed` | Referrer visits `/ref/:token` for the first time |
| `completed` | Referrer submits all 10 answers |
| `declined` | Referrer clicks Decline (form page or email link) |
| `call_requested` | Referrer clicks Request a Call (form page or email link) |

Reminders are sent only to `invited` and `viewed` referrers. Referrers in `declined` or `call_requested` are permanently excluded from reminders.

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
BACKEND_URL=http://localhost:4000    # used to build the LinkedIn OAuth callback URL
PORT=4000
GOOGLE_CLIENT_ID=...                 # from Google Cloud Console (OAuth 2.0 client)
LINKEDIN_CLIENT_ID=...               # from LinkedIn Developer Portal — omit to disable LinkedIn sign-in (503, not a crash)
LINKEDIN_CLIENT_SECRET=...
ADMIN_REPORT_EMAILS=admin@vouchmetrics.com  # comma-separated; receives the daily reminder digest, and is CC'd on Talent Pool contact requests + new job applicants
```

**Frontend** (`erefs-app/frontend/.env`):
```
VITE_API_URL=   # leave empty locally; Vite proxies /api → localhost:4000
```

### Testing

Backend tests only (no frontend tests). Uses Jest + Supertest. Tests mock the `pg` pool and external services (`llm.js`, `email.js`) with `jest.mock`. `tests/helpers.js` provides `makeToken()`, `makeAdminToken()`, `authHeader()`, and `mockDbClient()` utilities. `tests/setup.js` sets required env vars before any test file loads. **Note:** test coverage has not been extended to the routes/services added after the initial MVP (candidateProfile, talent, jobs, optionalAuth) — only the original routes have Jest coverage.
