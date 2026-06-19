# VouchMetrics — Product Requirements Document
**Elite Referral Automation Platform**
Version 1.0 | May 2026

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
- Add referrers and track response status (Pending / Completed)
- View and manage Reference Reports
- Share report via link or PDF export
- Re-use referrers across multiple job applications

### Employer Dashboard
- Create company profile and job postings
- Invite candidates for referral check (by email)
- Track referral status across all candidates in a pipeline view
- View AI Analytics Reports per candidate
- Compare candidates side-by-side (future)

### Referrer Experience
- No login required — one-click form via email link
- Mobile-friendly form
- Progress indicator (10 questions)
- Confirmation screen after submission

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
- **PostgreSQL** for persistent data (users, referrers, responses, reports)
- **JWT** authentication (job seekers + employers)
- **Nodemailer** for transactional email
- **Anthropic Claude API** for LLM report generation
- **PDF generation** via Puppeteer or pdfkit

### Hosting (Recommended)
- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase (managed PostgreSQL)

---

## 9. Data Model (Core Tables)

| Table | Key Fields |
|-------|-----------|
| users | id, email, role (jobseeker/employer), name, company |
| jobs | id, employer_id, title, description, status |
| referral_requests | id, requester_id, requester_role, candidate_name, candidate_email, job_id, status |
| referrers | id, referral_request_id, name, email, token, submitted_at |
| responses | id, referrer_id, question_number, answer_text, rating |
| reports | id, referral_request_id, llm_output_json, pdf_url, share_token, created_at |

---

## 10. Pages / Routes

### Public
- `/` — Landing page
- `/ref/:token` — Referrer form (no login)
- `/report/:shareToken` — View-only report

### Job Seeker (auth required)
- `/dashboard` — Overview, recent requests
- `/references/new` — Create new referral request
- `/references/:id` — View request + referrer status
- `/reports/:id` — View generated report

### Employer (auth required)
- `/employer/dashboard` — Pipeline view of candidates
- `/employer/jobs` — Manage job postings
- `/employer/candidates/:id` — Candidate referral status + report

---

## 11. Non-Functional Requirements

- **Security:** All referrer tokens are UUID-based, single-use, expirable (30 days)
- **Privacy:** Referrer responses are anonymized in multi-referrer reports
- **Accessibility:** WCAG 2.1 AA compliant forms
- **Mobile:** Fully responsive — referrer form must work on mobile
- **Performance:** Report generation < 15 seconds end-to-end
- **Scalability:** Stateless API, horizontally scalable

---

## 12. MVP Scope (Phase 1)

Phase 1 ships with:
- Job Seeker sign-up + referral request flow
- Referrer form (10 questions, no login)
- LLM report generation + view
- Employer sign-up + candidate referral request flow
- Shareable report link

Out of scope for Phase 1:
- PDF export
- Side-by-side candidate comparison
- LinkedIn import
- Integrations (ATS, Slack, email providers)

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
