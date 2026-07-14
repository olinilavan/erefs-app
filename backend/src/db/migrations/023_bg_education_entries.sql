CREATE TABLE IF NOT EXISTS bg_education_entries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_id            UUID NOT NULL REFERENCES background_checks(id) ON DELETE CASCADE,
  institution         VARCHAR(255) NOT NULL,
  degree_type         VARCHAR(100) NOT NULL,
  field_of_study      VARCHAR(255),
  start_year          INTEGER,
  graduation_year     INTEGER,
  gpa                 DECIMAL(3,2),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  verification_notes  TEXT,
  verified_at         TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bg_education_check_idx ON bg_education_entries(check_id);
