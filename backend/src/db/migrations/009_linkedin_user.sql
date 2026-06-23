-- Store candidate's own LinkedIn URL on their profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
