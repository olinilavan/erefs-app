-- Flash Jobs: paid, time-limited featured placement on the home page.
-- Payment is manual/invoice-based for v1 (no payment processor integration yet) —
-- an employer requests Flash status, an admin confirms payment externally and activates it.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS flash_status VARCHAR(20); -- NULL | 'pending_payment' | 'active'
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS flash_requested_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS flash_activated_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS flash_expires_at TIMESTAMP;
