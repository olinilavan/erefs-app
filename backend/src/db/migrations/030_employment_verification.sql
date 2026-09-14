ALTER TABLE background_checks ADD COLUMN IF NOT EXISTS include_employment BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS bg_employment_entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_id            UUID NOT NULL REFERENCES background_checks(id) ON DELETE CASCADE,
  -- Candidate-submitted
  employer_name       VARCHAR(255) NOT NULL,
  job_title           VARCHAR(255) NOT NULL,
  start_year          INTEGER,
  start_month         INTEGER,
  end_year            INTEGER,
  end_month           INTEGER,
  is_current          BOOLEAN NOT NULL DEFAULT false,
  supervisor_name     VARCHAR(255),
  supervisor_contact  VARCHAR(255),
  reason_for_leaving  TEXT,
  -- VM verification
  verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  contact_person      VARCHAR(255),
  contact_role        VARCHAR(255),
  contact_phone       VARCHAR(100),
  verification_notes  TEXT,
  verified_at         TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bg_employment_check_idx ON bg_employment_entries(check_id);
