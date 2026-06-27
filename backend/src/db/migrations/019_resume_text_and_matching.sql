-- Resume text (parsed from an uploaded PDF/DOC/DOCX or pasted directly) feeds the
-- employer-side AI candidate matching. The raw file is never stored — only the
-- extracted text — so this needs no blob/file storage infra.
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS resume_text TEXT;

-- AI matching results are cached per applicant so re-viewing the page doesn't
-- re-trigger a Groq call; only an explicit "Match Candidates" click does.
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS fit_score INT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS fit_rationale TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS fit_evaluated_at TIMESTAMP;
