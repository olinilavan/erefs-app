# VouchMetrics — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL (or a Supabase project)
- [Groq API key](https://console.groq.com) — for LLM report generation
- [Resend API key](https://resend.com) — for transactional email
- [Google Cloud Console project](https://console.cloud.google.com) — for Google Sign-In (OAuth 2.0 client ID)

## 1. Database Setup

Create a PostgreSQL database and run the schema, then apply all migrations in order:
```bash
psql $DATABASE_URL -f backend/src/db/schema.sql
psql $DATABASE_URL -f backend/src/db/migrations/001_settings_and_archive.sql
psql $DATABASE_URL -f backend/src/db/migrations/002_terms_admin_custom_questions.sql
psql $DATABASE_URL -f backend/src/db/migrations/003_employer_deactivate.sql
psql $DATABASE_URL -f backend/src/db/migrations/004_password_reset.sql
psql $DATABASE_URL -f backend/src/db/migrations/005_email_verification.sql
psql $DATABASE_URL -f backend/src/db/migrations/006_google_auth.sql
psql $DATABASE_URL -f backend/src/db/migrations/007_referrer_status.sql
psql $DATABASE_URL -f backend/src/db/migrations/008_linkedin.sql
psql $DATABASE_URL -f backend/src/db/migrations/009_linkedin_user.sql
psql $DATABASE_URL -f backend/src/db/migrations/010_candidate_self_report.sql
psql $DATABASE_URL -f backend/src/db/migrations/011_linkedin_oauth.sql
psql $DATABASE_URL -f backend/src/db/migrations/011_resume_link.sql
psql $DATABASE_URL -f backend/src/db/migrations/012_combined_share.sql
psql $DATABASE_URL -f backend/src/db/migrations/013_share_link_expiry.sql
psql $DATABASE_URL -f backend/src/db/migrations/014_talent_directory.sql
psql $DATABASE_URL -f backend/src/db/migrations/015_talent_profile_fields.sql
psql $DATABASE_URL -f backend/src/db/migrations/016_job_postings.sql
psql $DATABASE_URL -f backend/src/db/migrations/017_job_expiry.sql
psql $DATABASE_URL -f backend/src/db/migrations/018_flash_jobs.sql
```
> Note: two files are both numbered `011` (`011_linkedin_oauth.sql` and `011_resume_link.sql`) — a known duplicate from parallel work. Both are additive/idempotent (`ADD COLUMN IF NOT EXISTS`) and safe to run in either order.

Or use [Supabase](https://supabase.com) — paste the schema and each migration into the SQL editor in order.

## 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
# API runs on http://localhost:4000
```

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## 4. Run Both Together (from erefs-app/)

```bash
npm run dev
```

## Environment Variables (backend/.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random secret for signing JWTs |
| `GROQ_API_KEY` | From https://console.groq.com |
| `LLM_MODEL` | Optional — defaults to `llama-3.3-70b-versatile` |
| `RESEND_API_KEY` | From https://resend.com (omit in dev — emails log to console) |
| `EMAIL_FROM` | Verified sender address in Resend |
| `FRONTEND_URL` | `http://localhost:5173` in dev (comma-separated for multiple origins) |
| `PORT` | Defaults to 4000 |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `BACKEND_URL` | `http://localhost:4000` in dev — used to build the LinkedIn callback URL |
| `LINKEDIN_CLIENT_ID` | From LinkedIn Developer Portal |
| `LINKEDIN_CLIENT_SECRET` | From LinkedIn Developer Portal |

### Setting up Google Sign-In
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:5173` to Authorized JavaScript Origins
4. Copy the Client ID into `GOOGLE_CLIENT_ID` in backend `.env` and `VITE_GOOGLE_CLIENT_ID` in frontend `.env`

### Setting up LinkedIn Sign-In

LinkedIn uses a server-side redirect flow (unlike Google's client-side credential). The callback goes to the **backend**.

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → Create app
2. Under **Products**, add: **"Sign In with LinkedIn using OpenID Connect"**
3. Under **Auth** tab → **Authorized redirect URLs for your app**, add:
   - Dev: `http://localhost:4000/api/auth/linkedin/callback`
   - Prod: `https://your-api.example.com/api/auth/linkedin/callback`
4. Copy **Client ID** → `LINKEDIN_CLIENT_ID` in backend `.env`
5. Copy **Client Secret** → `LINKEDIN_CLIENT_SECRET` in backend `.env`

**What LinkedIn provides via standard Sign-In (OpenID Connect):**
- ✅ Name, email address, profile photo
- ❌ Work history & positions — requires [LinkedIn Partner Programme](https://business.linkedin.com/marketing-solutions/marketing-partners) (restricted, application required)
- ❌ Connections / network data — not available via any public API

**To run the migration:**
```bash
psql $DATABASE_URL -f backend/src/db/migrations/011_linkedin_oauth.sql
```

## Project Structure

```
erefs-app/
├── backend/
│   └── src/
│       ├── index.js               # Express entry point + cron start
│       ├── db.js                  # PostgreSQL pool
│       ├── db/
│       │   ├── schema.sql         # Base schema (source of truth)
│       │   └── migrations/        # Numbered through 018 — apply in order (see note on duplicate 011s above)
│       ├── middleware/
│       │   ├── auth.js            # JWT verification (required — 401 if missing/invalid)
│       │   └── optionalAuth.js    # Identifies user if token present, never blocks (public routes with personalized state)
│       ├── routes/
│       │   ├── auth.js            # Register / Login / Google OAuth / LinkedIn OAuth
│       │   ├── referrals.js       # Create & list referral requests, combined share link
│       │   ├── referrers.js       # Token-based referrer form, decline, call-request
│       │   ├── candidateProfile.js# Token-based candidate self-report (Professional Check, employer flow only)
│       │   ├── reports.js         # View reports (single + share, with expiry)
│       │   ├── employer.js        # Candidate pipeline, job postings, Talent Pool + contact
│       │   ├── talent.js          # Public Talent Pool browse (no auth)
│       │   ├── jobs.js            # Public Open Roles + Flash Jobs browse, jobseeker apply
│       │   ├── settings.js        # User settings (incl. resume link, Talent Pool opt-ins, share expiry)
│       │   └── admin.js           # Admin dashboard routes + Flash Job payment queue
│       └── services/
│           ├── llm.js             # Groq report generation (completed referrers only)
│           ├── linkedin.js        # LLM analysis of candidate's self-reported summary (no scraping)
│           ├── email.js           # Resend — invite, reminder, password reset, verification, candidate-profile invite, Talent Pool contact, new applicant
│           └── reminders.js       # Daily 08:00 cron — sends reminders to invited/viewed referrers
└── frontend/
    └── src/
        ├── App.jsx                # All routes + PrivateRoute guard (some routes intentionally public)
        ├── api.js                 # Axios instance (JWT attached automatically)
        ├── context/AuthContext.jsx
        ├── components/
        │   └── Pagination.jsx     # Shared pagination control
        ├── utils/url.js           # normalizeUrl() — prepends https:// to bare-domain links
        └── pages/
            ├── Landing.jsx            # Includes the Flash Jobs section
            ├── Login.jsx
            ├── Register.jsx
            ├── GoogleRoleSelect.jsx   # Role picker for new Google sign-in users
            ├── LinkedInSuccess.jsx    # LinkedIn OAuth callback landing
            ├── LinkedInRoleSelect.jsx # Role picker for new LinkedIn sign-in users
            ├── Dashboard.jsx          # Job seeker — referral requests, resume link
            ├── NewReferral.jsx
            ├── ReferralDetail.jsx     # Per-referrer status badges + Professional Profile (employer flow)
            ├── ReferrerForm.jsx       # 10-question form + Decline / Request a Call
            ├── CandidateProfile.jsx   # Public self-report form (Professional Check)
            ├── Report.jsx             # Authenticated report view
            ├── PublicReport.jsx       # Shareable read-only report (single, with expiry)
            ├── CombinedReport.jsx     # Shareable read-only report (all completed reports for one request)
            ├── EmployerDashboard.jsx
            ├── EmployerJobs.jsx       # Post/edit/delete job postings, request Flash
            ├── JobApplicants.jsx      # Applicants per job posting
            ├── TalentDirectory.jsx    # Employer-side Talent Pool (authenticated)
            ├── PublicTalentDirectory.jsx # Public Talent Pool (/talent)
            ├── OpenRoles.jsx          # Public job board (/jobs)
            ├── AdminDashboard.jsx     # Includes Flash Job payment queue
            └── Settings.jsx
```
