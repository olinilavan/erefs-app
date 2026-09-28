CREATE TABLE IF NOT EXISTS demo_enquiries (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enquiry_type VARCHAR(20)  NOT NULL DEFAULT 'demo', -- demo | enquiry
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  company      VARCHAR(255),
  job_title    VARCHAR(255),
  team_size    VARCHAR(50),
  message      TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'new', -- new | contacted | converted | closed
  admin_notes  TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS demo_enquiries_status_idx ON demo_enquiries(status);
CREATE INDEX IF NOT EXISTS demo_enquiries_created_idx ON demo_enquiries(created_at DESC);
