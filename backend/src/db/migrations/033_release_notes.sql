CREATE TABLE IF NOT EXISTS release_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version     VARCHAR(50)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  sent_to     INTEGER      NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
