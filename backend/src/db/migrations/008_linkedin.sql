-- Add LinkedIn URL and analysis fields
ALTER TABLE referral_requests
  ADD COLUMN IF NOT EXISTS candidate_linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_analysis_json JSONB;
