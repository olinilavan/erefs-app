-- Links a referral_request that was auto-created from a background check submission
ALTER TABLE referral_requests
  ADD COLUMN IF NOT EXISTS bg_check_id UUID REFERENCES background_checks(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS referral_requests_bg_check_idx ON referral_requests(bg_check_id);
