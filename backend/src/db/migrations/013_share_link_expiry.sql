-- Share links (single report + combined) now expire. Default 14 days, configurable per jobseeker.
ALTER TABLE users ADD COLUMN IF NOT EXISTS share_link_expiry_days INT DEFAULT 14;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMP;
ALTER TABLE referral_requests ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMP;

-- Give already-issued links a fresh 14-day window starting now, rather than retroactively
-- computing from their original creation date (which could expire already-shared links instantly).
UPDATE reports SET share_token_expires_at = NOW() + INTERVAL '14 days' WHERE share_token_expires_at IS NULL;
UPDATE referral_requests SET share_token_expires_at = NOW() + INTERVAL '14 days' WHERE share_token_expires_at IS NULL;
