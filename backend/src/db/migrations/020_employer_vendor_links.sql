-- Employer-to-employer vendor relationships. No new role — any employer
-- account can request to become another employer's vendor. The buyer
-- (job-posting company) approves or declines; once approved, the vendor
-- can view the buyer's job postings and submit candidates to them.
-- Links are direct only (no transitive chaining through sub-vendors).
CREATE TABLE IF NOT EXISTS employer_vendor_links (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_employer_id  UUID NOT NULL REFERENCES users(id),
  vendor_employer_id UUID NOT NULL REFERENCES users(id),
  status             VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | declined | revoked
  requested_at       TIMESTAMP DEFAULT NOW(),
  approved_at        TIMESTAMP,
  revoked_at         TIMESTAMP,
  CHECK (buyer_employer_id != vendor_employer_id),
  UNIQUE (buyer_employer_id, vendor_employer_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_links_buyer  ON employer_vendor_links(buyer_employer_id);
CREATE INDEX IF NOT EXISTS idx_vendor_links_vendor ON employer_vendor_links(vendor_employer_id);
