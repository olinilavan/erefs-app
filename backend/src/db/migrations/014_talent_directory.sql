-- Talent directory: jobseekers opt in to anonymized visibility (role + reference status only)
-- and optionally to employer contact. Outreach is brokered by VouchMetrics — the employer's
-- contact details are emailed to the jobseeker, never the reverse.
ALTER TABLE users ADD COLUMN IF NOT EXISTS publicly_discoverable BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_employer_contact BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  jobseeker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employer_name VARCHAR(255) NOT NULL,
  employer_email VARCHAR(255) NOT NULL,
  employer_phone VARCHAR(50) NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (employer_id, jobseeker_id)
);
