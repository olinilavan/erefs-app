-- Jobseeker flow stays lightweight: just an optional resume link, no verification
-- or LLM processing. Professional background checks are employer-flow only (separate, larger feature).
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE referral_requests ADD COLUMN IF NOT EXISTS resume_url TEXT;
