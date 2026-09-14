ALTER TABLE bg_education_entries
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_role   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_phone  VARCHAR(100);

-- Widen verification_status to match employment entries (was VARCHAR(20))
ALTER TABLE bg_education_entries
  ALTER COLUMN verification_status TYPE VARCHAR(30);
