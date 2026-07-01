-- Lightweight vendor candidate submissions — no persistent bench/roster.
-- An approved vendor (see employer_vendor_links) submits a candidate
-- directly against one of the buyer's jobs. Resume handling mirrors
-- job_applications: only parsed text is stored, never the raw file.
CREATE TABLE IF NOT EXISTS vendor_submissions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id             UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  vendor_employer_id UUID NOT NULL REFERENCES users(id),
  candidate_name     VARCHAR(255) NOT NULL,
  candidate_email    VARCHAR(255) NOT NULL,
  candidate_phone    VARCHAR(50),
  resume_text        TEXT,
  cover_note         TEXT,
  status             VARCHAR(20) NOT NULL DEFAULT 'submitted',
                     -- submitted | reviewed | shortlisted | rejected | hired
  created_at         TIMESTAMP DEFAULT NOW(),
  reviewed_at        TIMESTAMP,
  UNIQUE (job_id, vendor_employer_id, candidate_email)
);

CREATE INDEX IF NOT EXISTS idx_vendor_submissions_job    ON vendor_submissions(job_id);
CREATE INDEX IF NOT EXISTS idx_vendor_submissions_vendor ON vendor_submissions(vendor_employer_id);

-- Per-account default for the job-posting visibility selector (Public vs
-- Vendor Only) — purely a form pre-fill, not an access-control gate.
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_job_is_public BOOLEAN DEFAULT true;
