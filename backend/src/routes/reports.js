const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/:id — authenticated view
router.get('/:id', auth, async (req, res) => {
  const result = await db.query(
    `SELECT r.*, rf.name AS referrer_name, rr.target_role, rr.requester_id
     FROM reports r
     JOIN referrers rf ON rf.id = r.referrer_id
     JOIN referral_requests rr ON rr.id = rf.referral_request_id
     WHERE r.id = $1 AND rr.requester_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// GET /api/reports/share/:shareToken — public view-only
router.get('/share/:shareToken', async (req, res) => {
  const result = await db.query(
    `SELECT r.llm_output_json, r.created_at, rf.name AS referrer_name, rr.target_role
     FROM reports r
     JOIN referrers rf ON rf.id = r.referrer_id
     JOIN referral_requests rr ON rr.id = rf.referral_request_id
     WHERE r.share_token = $1`,
    [req.params.shareToken]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Report not found' });
  res.json(result.rows[0]);
});

module.exports = router;
