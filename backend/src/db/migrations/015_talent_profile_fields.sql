-- Disambiguate talent directory listings beyond headline alone, and give every
-- user a stable, non-identifying reference code (VM ID) usable in support/outreach
-- without ever exposing name or email.
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vm_id VARCHAR(20) UNIQUE;

CREATE OR REPLACE FUNCTION set_vm_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vm_id IS NULL THEN
    NEW.vm_id := 'VM-' || upper(substr(md5(random()::text || clock_timestamp()::text || NEW.id::text), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_vm_id ON users;
CREATE TRIGGER trg_set_vm_id BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION set_vm_id();

-- Backfill existing users
UPDATE users SET vm_id = 'VM-' || upper(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 6))
WHERE vm_id IS NULL;
