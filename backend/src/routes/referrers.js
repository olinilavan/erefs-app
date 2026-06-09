const express = require('express');
const db = require('../db');
const { generateReport } = require('../services/llm');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/referrers/:token — load referrer form (no auth needed)
router.get('/:token', async (req, res) => {
  if (!UUID_RE.test(req.params.token)) return res.status(404).json({ error: 'Invalid or expired link' });
  const result = await db.query(
    `SELECT rf.*, rr.target_role, rr.candidate_name
     FROM referrers rf
     JOIN referral_requests rr ON rr.id = rf.referral_request_id
     WHERE rf.token = $1 AND rf.token_expires_at > NOW()`,
    [req.params.token]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Invalid or expired link' });
  if (result.rows[0].submitted_at) return res.status(400).json({ error: 'Already submitted' });
  res.json(result.rows[0]);
});

// POST /api/referrers/:token/submit — submit 10 answers
router.post('/:token/submit', async (req, res) => {
  if (!UUID_RE.test(req.params.token)) return res.status(404).json({ error: 'Invalid or expired link' });
  const { answers } = req.body; // [{ questionNumber, answerText, rating }]
  const client = await db.connect();
  try {
    const refResult = await client.query(
      `SELECT rf.*, rr.id AS referral_request_id
       FROM referrers rf
       JOIN referral_requests rr ON rr.id = rf.referral_request_id
       WHERE rf.token = $1 AND rf.token_expires_at > NOW() AND rf.submitted_at IS NULL`,
      [req.params.token]
    );
    if (!refResult.rows.length) return res.status(400).json({ error: 'Invalid, expired, or already submitted' });
    const referrer = refResult.rows[0];

    await client.query('BEGIN');
    for (const a of answers) {
      await client.query(
        `INSERT INTO responses (referrer_id, question_number, answer_text, rating) VALUES ($1, $2, $3, $4)`,
        [referrer.id, a.questionNumber, a.answerText || null, a.rating || null]
      );
    }
    await client.query(`UPDATE referrers SET submitted_at = NOW() WHERE id = $1`, [referrer.id]);
    await client.query('COMMIT');

    // Generate this referrer's individual report immediately
    generateReport(referrer.id).catch((err) => {
      console.error('[generateReport failed]', err.message);
    });

    // Mark referral request completed when all referrers have submitted
    const pendingResult = await client.query(
      `SELECT COUNT(*) FROM referrers WHERE referral_request_id = $1 AND submitted_at IS NULL`,
      [referrer.referral_request_id]
    );
    if (parseInt(pendingResult.rows[0].count) === 0) {
      await client.query(
        `UPDATE referral_requests SET status = 'completed' WHERE id = $1`,
        [referrer.referral_request_id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
