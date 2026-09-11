CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  entity_name VARCHAR(255),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activity_log_company_idx ON activity_log(company_id);
CREATE INDEX IF NOT EXISTS activity_log_actor_idx ON activity_log(actor_id);
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log(created_at DESC);

ALTER TABLE background_checks ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES users(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES users(id);
ALTER TABLE workforce_resources ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES users(id);
