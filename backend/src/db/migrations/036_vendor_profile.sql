ALTER TABLE users
  ADD COLUMN IF NOT EXISTS vendor_specializations TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vendor_states          TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vendor_bio             TEXT,
  ADD COLUMN IF NOT EXISTS vendor_website         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS vendor_placement_volume VARCHAR(50);
