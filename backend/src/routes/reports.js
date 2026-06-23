const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/:id — authenticated view
router.get('/:id', auth, async (req, res) => {
  const result = await db.query(
    `SELECT r.*, rf.name AS referrer_name, rr.target_role, rr.requester_id,
            rr.linkedin_analysis_json, rr.candidate_linkedin_url,
            CASE WHEN rr.requester_role = 'jobseeker' THEN COALESCE(u.resume_url, rr.resume_url) ELSE NULL END AS resume_url
     FROM reports r
     JOIN referrers rf ON rf.id = r.referrer_id
     JOIN referral_requests rr ON rr.id = rf.referral_request_id
     LEFT JOIN users u ON u.id = rr.requester_id
     WHERE r.id = $1 AND rr.requester_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// GET /api/reports/share/:shareToken — public view-only
router.get('/share/:shareToken', async (req, res) => {
  const result = await db.query(
    `SELECT r.llm_output_json, r.created_at, r.share_token_expires_at, rf.name AS referrer_name, rr.target_role,
            rr.linkedin_analysis_json, rr.candidate_linkedin_url,
            CASE WHEN rr.requester_role = 'jobseeker' THEN COALESCE(u.resume_url, rr.resume_url) ELSE NULL END AS resume_url
     FROM reports r
     JOIN referrers rf ON rf.id = r.referrer_id
     JOIN referral_requests rr ON rr.id = rf.referral_request_id
     LEFT JOIN users u ON u.id = rr.requester_id
     WHERE r.share_token = $1`,
    [req.params.shareToken]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Report not found' });
  const row = result.rows[0];
  if (row.share_token_expires_at && new Date(row.share_token_expires_at) < new Date()) {
    return res.status(410).json({ error: 'expired' });
  }
  res.json(row);
});

module.exports = router;
