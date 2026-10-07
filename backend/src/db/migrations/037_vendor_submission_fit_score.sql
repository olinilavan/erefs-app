ALTER TABLE vendor_submissions
  ADD COLUMN IF NOT EXISTS fit_score        INTEGER,
  ADD COLUMN IF NOT EXISTS fit_rationale    TEXT,
  ADD COLUMN IF NOT EXISTS fit_evaluated_at TIMESTAMP;
