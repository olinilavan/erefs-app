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
```

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

### Setting up Google Sign-In
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:5173` to Authorized JavaScript Origins
4. Copy the Client ID into `GOOGLE_CLIENT_ID` in backend `.env` and `VITE_GOOGLE_CLIENT_ID` in frontend `.env`

## Project Structure

```
erefs-app/
├── backend/
│   └── src/
│       ├── index.js               # Express entry point + cron start
│       ├── db.js                  # PostgreSQL pool
│       ├── db/
│       │   ├── schema.sql         # Base schema (source of truth)
│       │   └── migrations/        # Numbered — apply in order
│       ├── middleware/auth.js     # JWT verification
│       ├── routes/
│       │   ├── auth.js            # Register / Login / Google OAuth
│       │   ├── referrals.js       # Create & list referral requests
│       │   ├── referrers.js       # Token-based referrer form, decline, call-request
│       │   ├── reports.js         # View reports
│       │   ├── employer.js        # Employer-specific routes
│       │   ├── settings.js        # User settings
│       │   └── admin.js           # Admin dashboard routes
│       └── services/
│           ├── llm.js             # Groq report generation (completed referrers only)
│           ├── email.js           # Resend — invite, reminder, password reset, verification
│           └── reminders.js       # Daily 08:00 cron — sends reminders to invited/viewed referrers
└── frontend/
    └── src/
        ├── App.jsx                # All routes + PrivateRoute guard
        ├── api.js                 # Axios instance (JWT attached automatically)
        ├── context/AuthContext.jsx
        └── pages/
            ├── Landing.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── GoogleRoleSelect.jsx   # Role picker for new Google sign-in users
            ├── Dashboard.jsx          # Job seeker — referral requests list
            ├── NewReferral.jsx
            ├── ReferralDetail.jsx     # Per-referrer status badges + legend
            ├── ReferrerForm.jsx       # 10-question form + Decline / Request a Call
            ├── Report.jsx             # Authenticated report view
            ├── PublicReport.jsx       # Shareable read-only report
            ├── EmployerDashboard.jsx
            ├── AdminDashboard.jsx
            └── Settings.jsx
```
