# VouchMetrics — Product Requirements Document
**Elite Referral Automation Platform**
Version 1.1 | June 2026 — updated to reflect the Talent Pool, Open Roles, Flash Jobs, and Professional Check features shipped after the original v1.0 MVP.

---

## 1. Executive Summary

VouchMetrics automates and elevates the employee referral process for two audiences: job seekers who want professional, pre-prepared references, and employers who want verified, AI-analyzed referrals at the point of candidate selection.

---

## 2. Product Vision

> "Turn referrals from a favor into a data-driven signal."

Today's referral process is informal, inconsistent, and slow. VouchMetrics standardizes the collection of referral feedback through structured questionnaires, then uses an LLM to synthesize responses into a professional analytics report — shareable with a single link.

---

## 3. User Personas

### 3.1 Job Seeker (Candidate)
- Applying for roles and wants to proactively gather references
- Sends referral request to former colleagues/managers before submitting job applications
- Wants a polished, shareable reference package ready to present to any employer

### 3.2 Referrer (Reference Provider)
- A former colleague, manager, or peer of the candidate
- Receives a link to answer 10 structured questions
- Does not need to create an account

### 3.3 Employer / Hiring Manager
- At Round 1 or Round 2 of the interview process, wants verified third-party signal on a candidate
- Sends a referral request directly to a candidate's designated references
- Receives a comprehensive AI-generated analytics report

---

## 4. Use Cases

### Use Case 1: Job Seeker-Initiated Reference Package

**Flow:**
1. Job Seeker signs up on VouchMetrics
2. Adds the job/role they are targeting (optional context for the referrer)
3. Enters referrer name + email (1–5 referrers)
4. System sends referrer a branded email with a unique link to the 10-question form
5. Referrer completes the form (no login required)
6. System passes responses to LLM → generates Reference Report
7. Job Seeker reviews the report in their dashboard
8. Job Seeker shares a link or PDF of the report with any employer

**Key Value:** Candidate walks into interviews with a ready-made, professional reference packet.

---

### Use Case 2: Employer-Initiated Referral Request

**Flow:**
1. Employer signs up and creates a job posting in VouchMetrics
2. After Round 1 or Round 2, employer marks a candidate for referral check
3. Employer enters candidate's name + email
4. System notifies candidate: "Your referral check has been requested by [Company]"
5. Candidate enters their referrer's contact details (or pre-existing referrers from their profile)
6. Referrer receives branded email with 10-question form link
7. Referrer submits responses
8. LLM generates Analytics Report
9. Employer receives report via dashboard + email notification

**Key Value:** Employer gets structured, AI-analyzed referral data mid-funnel, not as a last-minute box-check.

---

### Use Case 3: Candidate Professional Check (Employer Flow Only)

**Flow:**
1. Employer creates a referral request with the candidate's email
2. System emails the candidate a link to a public self-report form (no login)
3. Candidate optionally writes a short professional summary in their own words
4. LLM turns the self-report into a structured "Professional Profile" (current role, skills, career trajectory) shown alongside the reference report, clearly labeled as self-reported and not independently verified
5. Jobseeker-initiated requests never trigger this — jobseekers use the lighter-weight resume-link flow instead (see Use Case 1)

**Key Value:** Gives employers extra context on a candidate without resorting to LinkedIn scraping, which is legally unviable (Proxycurl, the would-be data provider, was shut down in 2026 following a LinkedIn lawsuit over unauthorized scraping). Everything here is **self-reported only** — no automated data extraction from any third party.

---

### Use Case 4: Talent Pool (Anonymized Candidate Directory)

**Flow:**
1. Jobseeker opts in via two Settings toggles: "Show my profile publicly" and "Allow employers to reach out"
2. Their profile (headline, years of experience, location, availability, reference-complete status) appears in a public, paginated directory — **never their name or email**
3. Logged-in employers browse and click "Reach Out," submitting their own contact info
4. VouchMetrics emails the **employer's** contact details to the jobseeker — the jobseeker decides whether to respond, and the employer never learns the jobseeker's identity unless they do
5. One outreach request per employer/jobseeker pair (no repeat contact)

**Key Value:** Lead generation for employers without compromising jobseeker privacy — the opposite contact direction from a typical job board.

---

### Use Case 5: Open Roles (Job Board) + Flash Jobs (Paid Featured Placement)

**Flow:**
1. Employer posts a job (title, description, location, work authorization requirement, optional expiration date)
2. Anyone — logged in or not — can browse open roles; only a logged-in jobseeker can apply
3. Applying is a standard, non-brokered disclosure: the employer sees the applicant's real name, email, and resume link, same as any normal job application
4. **Flash Jobs** are a paid upsell: the employer requests featured home-page placement, an admin manually confirms payment was received (no payment processor is integrated yet) and activates it, and the posting appears in a "🔥 Flash Jobs" section on the home page for 7 days. The 5 most-recently-activated Flash Jobs show at any time; older ones simply roll off without any state change.

**Key Value:** A second monetizable surface beyond reference checks, while keeping Open Roles itself free and broadly visible.

---

## 5. The 10 Referral Questions

All questions are answered by the Referrer on a structured form. Questions include a mix of rating scales (1–5) and open text for LLM analysis.

| # | Question | Type |
|---|----------|------|
| 1 | How long have you known [Candidate] and in what capacity? | Text |
| 2 | On a scale of 1–5, how would you rate their overall job performance? | Rating + Comment |
| 3 | What are their top 3 professional strengths? | Text |
| 4 | Describe a situation where they handled a challenging problem or conflict. | Text (STAR) |
| 5 | On a scale of 1–5, how do you rate their collaboration and teamwork skills? | Rating + Comment |
| 6 | On a scale of 1–5, how do you rate their communication (written & verbal)? | Rating + Comment |
| 7 | Would you rehire or work with this person again? If not, why? | Yes/No + Text |
| 8 | What type of role or environment do you think they would thrive in most? | Text |
| 9 | Is there any area where they have shown significant growth or still need to develop? | Text |
| 10 | Any additional comments you'd like to share about this candidate? | Text |

---

## 6. LLM Analytics Report

After all referrer responses are collected, the system passes them to an LLM (e.g., Claude API) to produce a structured report with the following sections:

### 6.1 Report Sections
- **Executive Summary** — 2–3 sentence narrative summary of the candidate based on all responses
- **Strength Radar Chart** — Visual chart scoring: Performance, Teamwork, Communication, Problem-Solving, Leadership (derived from ratings + text analysis)
- **Key Strengths** — Bullet list of top recurring strengths mentioned across referrers
- **Areas for Development** — Balanced, constructive notes from Q9 responses
- **Culture & Role Fit** — Analysis of Q8 to suggest ideal environment/team type
- **Rehire Signal** — Aggregated Yes/No from Q7 with context
- **Notable Quotes** — 2–3 highlighted verbatim quotes from referrers
- **Confidence Score** — Overall signal strength based on number of referrers + response completeness

### 6.2 Report Sharing
- Shareable link (view-only, expirable)
- Downloadable PDF
- Employer dashboard view with filtering across all candidates

---

## 7. Features by Role

### Job Seeker Dashboard
- Create profile (name, headline, target role)
- Sign up with email/password or Google Sign-In
- Add referrers and track response status with enriched badges: Invited / Viewed / Completed / Declined / Call Requested
- View and manage Reference Reports (generated only for Completed referrers)
- Share report via link or PDF export
- Re-use referrers across multiple job applications

### Employer Dashboard
- Create company profile and job postings
- Sign up with email/password or Google Sign-In
- Invite candidates for referral check (by email)
- Track referral status across all candidates in a pipeline view with enriched status badges
- View AI Analytics Reports per candidate
- Call Requested status visible in dashboard — employer contacts referrer directly
- Compare candidates side-by-side (future)

### Referrer Experience
- No login required — one-click form via email link
- Invite email includes "Not able to help? Decline · Request a Call Instead" links for immediate action without opening the form
- Reminder emails (if enabled by requester) also include Decline and Request a Call links
- If reminders are enabled, invite email states the reminder schedule (e.g. "You'll receive a reminder in 7 days")
- Mobile-friendly form
- Progress indicator (10 questions)
- Decline or Request a Call buttons available on the form page (secondary actions, low visual weight)
- Confirmation screen after submission, decline, or call request

---

## 8. Technical Architecture

### Frontend
- **React** (Vite) — Single Page Application
- **React Router** for navigation
- **Recharts** for radar/analytics charts
- **TailwindCSS** for styling
- **Axios** for API calls

### Backend
- **Node.js + Express** REST API
- **PostgreSQL** for persistent data
- **JWT** authentication (job seekers + employers), plus Google and LinkedIn OAuth (the latter via "Sign In with LinkedIn using OpenID Connect" — name/email/photo only, no work history or connections)
- **Resend** for transactional email (not Nodemailer — implemented via the Resend API directly)
- **Groq API** (`llama-3.3-70b-versatile` via the Vercel AI SDK) for LLM report generation and Professional Profile analysis — not Anthropic Claude, despite the original v1.0 plan
- **PDF generation** — not implemented; still out of scope (see §12)

### Hosting (Recommended)
- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase (managed PostgreSQL)

---

## 9. Data Model (Core Tables)

| Table | Key Fields |
|-------|-----------|
| users | id, email, role (jobseeker/employer), name, company, google_id, linkedin_id, profile_photo_url, reminder_days, is_verified, is_admin, resume_url, share_link_expiry_days, **Talent Pool:** vm_id, publicly_discoverable, allow_employer_contact, headline, years_experience, location, availability |
| jobs | id, employer_id, title, description, status, location, work_requirement, is_public, expires_at, **Flash Jobs:** flash_status, flash_requested_at, flash_activated_at, flash_expires_at |
| job_applications | id, job_id, jobseeker_id, applicant_name, applicant_email, resume_url, message, created_at — unique per (job_id, jobseeker_id) |
| referral_requests | id, requester_id, requester_role, candidate_name, candidate_email, job_id, status, resume_url, share_token, share_token_expires_at, **Professional Check (employer flow only):** candidate_token, candidate_professional_summary, linkedin_analysis_json |
| referrers | id, referral_request_id, name, email, token, status (invited/viewed/completed/declined/call_requested), viewed_at, submitted_at |
| responses | id, referrer_id, question_number, answer_text, rating |
| reports | id, referrer_id, llm_output_json, share_token, share_token_expires_at, created_at |
| contact_requests | id, employer_id, jobseeker_id, employer_name, employer_email, employer_phone, message, created_at — unique per (employer_id, jobseeker_id); the Talent Pool's brokered-outreach record |

---

## 10. Pages / Routes

### Public (no login required)
- `/` — Landing page, including the Flash Jobs section
- `/ref/:token` — Referrer form
- `/candidate/:token` — Candidate self-report form (Professional Check)
- `/report/share/:shareToken` — View-only single report (expires per requester's setting)
- `/referrals/share/:shareToken` — View-only combined report (all completed reports for one request)
- `/talent` — Public Talent Pool browse
- `/jobs` — Public Open Roles browse (login only required to Apply)
- `/sample-report` — Static sample report for marketing

### Job Seeker (auth required)
- `/dashboard` — Overview, recent requests, resume link
- `/references/new` — Create new referral request
- `/references/:id` — View request + referrer status + Professional Profile (if employer-initiated)
- `/reports/:id` — View generated report

### Employer (auth required)
- `/employer/dashboard` — Pipeline view of candidates
- `/employer/jobs` — Post/edit/delete job postings, request Flash Jobs
- `/employer/jobs/:id/applicants` — Applicants per job posting
- `/employer/talent` — Talent Pool with brokered "Reach Out"

### Admin (auth + is_admin required)
- `/admin` — Platform-wide oversight, including the Flash Job payment-confirmation queue

---

## 11. Non-Functional Requirements

- **Security:** All referrer tokens are UUID-based, single-use, expirable (30 days)
- **Privacy:** Referrer responses are anonymized in multi-referrer reports
- **Accessibility:** WCAG 2.1 AA compliant forms
- **Mobile:** Fully responsive — referrer form must work on mobile
- **Performance:** Report generation < 15 seconds end-to-end
- **Scalability:** Stateless API, horizontally scalable

---

## 12. MVP Scope (Phase 1) — Shipped

Phase 1 shipped with:
- Job Seeker sign-up + referral request flow
- Referrer form (10 questions, no login)
- LLM report generation + view
- Employer sign-up + candidate referral request flow
- Shareable report link

Out of scope for Phase 1:
- PDF export
- Side-by-side candidate comparison
- ~~LinkedIn import~~
- Integrations (ATS, Slack, email providers)

## 12a. Phase 2 — Shipped (post-MVP additions)

- **Google + LinkedIn Sign-In** (OAuth login/registration convenience only — name/email/photo, never work history or connections)
- **Professional Check** — candidate self-reported summary, LLM-structured, employer flow only (see Use Case 3)
- **Resume links** — lightweight alternative for jobseekers, no LLM processing
- **Combined share links** with configurable expiry (default 14 days)
- **Talent Pool** — anonymized jobseeker directory with brokered employer outreach (Use Case 4)
- **Open Roles + Flash Jobs** — public job board, manual/invoice-based paid featured placement (Use Case 5)

**Explicitly rejected, not just deferred:** automated LinkedIn data import/scraping. Proxycurl, the data provider this was originally planned around, was shut down by LinkedIn's legal action in 2026 for unauthorized scraping. Every alternative scraping provider carries the same legal exposure. The Professional Check and Talent Pool features above are deliberately self-reported-only as a result — this is a permanent product constraint, not a temporary gap.

---

## 13. Success Metrics

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Registered job seekers | 500 |
| Referral forms completed | 1,000 |
| Reports generated | 400 |
| Employer accounts | 50 |
| Report-to-hire conversion tracked | 20% |

---

*Document prepared for VouchMetrics — Elite Referral Automation Platform*
*Next step: scaffold React + Node.js project*
