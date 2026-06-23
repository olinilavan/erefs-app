-- Combined share link: one URL covering all completed reports for a referral request,
-- so a candidate with multiple referrers doesn't have to send out N separate links.
ALTER TABLE referral_requests ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT uuid_generate_v4();
