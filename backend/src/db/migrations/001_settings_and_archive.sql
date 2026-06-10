-- Migration 001: user settings columns + referral archive support

ALTER TABLE users ADD COLUMN IF NOT EXISTS require_work_email BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_days INT DEFAULT 7;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'beta';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP DEFAULT NOW();

ALTER TABLE referral_requests ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
