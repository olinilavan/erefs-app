-- Candidate self-reported professional summary (replaces Proxycurl-based LinkedIn scraping,
-- which is no longer viable after Proxycurl's shutdown following LinkedIn's lawsuit).
ALTER TABLE referral_requests
  ADD COLUMN IF NOT EXISTS candidate_professional_summary TEXT,
  ADD COLUMN IF NOT EXISTS candidate_token UUID,
  ADD COLUMN IF NOT EXISTS candidate_token_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS candidate_profile_submitted_at TIMESTAMP;

-- Cached on the user's own profile so jobseekers only have to write it once
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_summary TEXT;
