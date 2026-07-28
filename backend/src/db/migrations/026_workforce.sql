CREATE TABLE IF NOT EXISTS workforce_resources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(50),
  job_title       VARCHAR(255),
  skills          TEXT,
  location        VARCHAR(255),
  employment_type VARCHAR(50) DEFAULT 'employee',
  status          VARCHAR(20) NOT NULL DEFAULT 'bench',
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workforce_resources_employer_idx ON workforce_resources(employer_id);
CREATE INDEX IF NOT EXISTS workforce_resources_status_idx  ON workforce_resources(status);

CREATE TABLE IF NOT EXISTS workforce_placements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id  UUID NOT NULL REFERENCES workforce_resources(id) ON DELETE CASCADE,
  client_name  VARCHAR(255) NOT NULL,
  project_name VARCHAR(255),
  start_date   DATE NOT NULL,
  end_date     DATE,
  bill_rate    DECIMAL(10,2),
  pay_rate     DECIMAL(10,2),
  rate_type    VARCHAR(20) DEFAULT 'hourly',
  status       VARCHAR(20) NOT NULL DEFAULT 'active',
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workforce_placements_resource_idx ON workforce_placements(resource_id);
CREATE INDEX IF NOT EXISTS workforce_placements_status_idx   ON workforce_placements(status);
