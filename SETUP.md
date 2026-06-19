# VouchMetrics — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL (or a Supabase project)
- Anthropic API key
- SMTP credentials (SendGrid recommended)

## 1. Database Setup

Create a PostgreSQL database and run the schema:
```bash
psql -U postgres -c "CREATE DATABASE erefs;"
psql -U postgres -d erefs -f backend/src/db/schema.sql
```

Or use [Supabase](https://supabase.com) — paste the schema into the SQL editor.

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

## 4. Run Both Together (from project root)

```bash
npm install
npm run dev
```

## Environment Variables (backend/.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random secret for signing JWTs |
| `ANTHROPIC_API_KEY` | From https://console.anthropic.com |
| `EMAIL_*` | SMTP credentials (SendGrid, etc.) |
| `FRONTEND_URL` | `http://localhost:5173` in dev |

## Project Structure

```
erefs-app/
├── backend/
│   └── src/
│       ├── index.js          # Express entry point
│       ├── db.js             # PostgreSQL pool
│       ├── db/schema.sql     # Database schema
│       ├── middleware/auth.js
│       ├── routes/
│       │   ├── auth.js       # Register / Login
│       │   ├── referrals.js  # Create & list referral requests
│       │   ├── referrers.js  # Referrer form + submission
│       │   ├── reports.js    # View reports
│       │   └── employer.js   # Employer-specific routes
│       └── services/
│           ├── llm.js        # Claude API report generation
│           └── email.js      # Nodemailer invite emails
└── frontend/
    └── src/
        ├── App.jsx           # Routes
        ├── context/AuthContext.jsx
        └── pages/
            ├── Landing.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx         # Job seeker
            ├── NewReferral.jsx
            ├── ReferralDetail.jsx
            ├── Report.jsx            # Authenticated report view
            ├── PublicReport.jsx      # Shareable report
            ├── ReferrerForm.jsx      # 10-question form (no login)
            └── EmployerDashboard.jsx
```
