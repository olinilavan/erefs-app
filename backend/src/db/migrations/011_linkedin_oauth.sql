-- LinkedIn OAuth Sign-In support
-- Adds LinkedIn identity fields alongside the existing Google OAuth fields.
-- linkedin_url (from 009) is a manually-entered URL; linkedin_id is the OAuth sub.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS linkedin_id     VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;       -- populated from LinkedIn OpenID Connect /userinfo
