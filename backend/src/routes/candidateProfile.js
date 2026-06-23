const express = require('express');
const db = require('../db');
const { generateProfileAnalysis } = require('../services/linkedin');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/candidate-profile/:token — public, loads candidate self-report form state
router.get('/:token', async (req, res) => {
  if (!UUID_RE.test(req.params.token)) return res.status(404).json({ error: 'Invalid or expired link' });
  const result = await db.query(
    `SELECT candidate_name, target_role, candidate_profile_submitted_at
     FROM referral_requests
     WHERE candidate_token = $1 AND candidate_token_expires_at > NOW()`,
    [req.params.token]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Invalid or expired link' });

  const row = result.rows[0];
  if (row.candidate_profile_submitted_at) {
    return res.json({ submitted: true, name: row.candidate_name });
  }
  res.json({ submitted: false, name: row.candidate_name, targetRole: row.target_role });
});

// POST /api/candidate-profile/:token/submit — public, one-time self-report submission
router.post('/:token/submit', async (req, res) => {
  if (!UUID_RE.test(req.params.token)) return res.status(404).json({ error: 'Invalid or expired link' });
  const { professionalSummary } = req.body;
  if (!professionalSummary?.trim()) return res.status(400).json({ error: 'Professional summary is required' });

  const result = await db.query(
    `UPDATE referral_requests
     SET candidate_professional_summary = $1, candidate_profile_submitted_at = NOW()
     WHERE candidate_token = $2 AND candidate_token_expires_at > NOW() AND candidate_profile_submitted_at IS NULL
     RETURNING id`,
    [professionalSummary.trim(), req.params.token]
  );
  if (!result.rows.length) return res.status(400).json({ error: 'Invalid, expired, or already submitted' });

  generateProfileAnalysis(result.rows[0].id).catch((err) => {
    console.error('[generateProfileAnalysis failed]', err.message);
  });

  res.json({ success: true });
});

module.exports = router;
