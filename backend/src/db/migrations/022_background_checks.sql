CREATE TABLE IF NOT EXISTS background_checks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_name    VARCHAR(255) NOT NULL,
  candidate_email   VARCHAR(255) NOT NULL,
  target_role       VARCHAR(255),
  include_reference BOOLEAN NOT NULL DEFAULT false,
  include_education BOOLEAN NOT NULL DEFAULT false,
  include_criminal  BOOLEAN NOT NULL DEFAULT false,
  status            VARCHAR(20) NOT NULL DEFAULT 'invited',
  token             UUID NOT NULL DEFAULT uuid_generate_v4(),
  deadline_days     INTEGER NOT NULL DEFAULT 7,
  expires_at        TIMESTAMP,
  submitted_at      TIMESTAMP,
  declined_at       TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS background_checks_token_idx ON background_checks(token);
CREATE INDEX IF NOT EXISTS background_checks_employer_idx ON background_checks(employer_id);
CREATE INDEX IF NOT EXISTS background_checks_status_idx ON background_checks(status);
