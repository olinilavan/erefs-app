CREATE TABLE IF NOT EXISTS bg_criminal_data (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_id      UUID NOT NULL REFERENCES background_checks(id) ON DELETE CASCADE,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_at    TIMESTAMP,
  address       TEXT,
  date_of_birth DATE,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS bg_criminal_check_idx ON bg_criminal_data(check_id);
