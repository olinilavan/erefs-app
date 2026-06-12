-- Migration 002: terms acceptance, admin flag, custom questions preference

ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wants_custom_questions BOOLEAN DEFAULT false;
