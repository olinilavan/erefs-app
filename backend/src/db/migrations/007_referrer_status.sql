ALTER TABLE referrers
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited','viewed','completed','declined','call_requested')),
  ADD COLUMN viewed_at TIMESTAMP;

-- Backfill existing submitted referrers
UPDATE referrers SET status = 'completed' WHERE submitted_at IS NOT NULL;
