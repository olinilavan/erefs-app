const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/employer/candidates?archived=true|false
router.get('/candidates', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const archived = req.query.archived === 'true';
  const result = await db.query(
    `SELECT rr.*,
       COUNT(DISTINCT rf.id) AS total_referrers,
       COUNT(DISTINCT rf.id) FILTER (WHERE rf.submitted_at IS NOT NULL) AS completed_referrers
     FROM referral_requests rr
     LEFT JOIN referrers rf ON rf.referral_request_id = rr.id
     WHERE rr.requester_id = $1 AND rr.archived_at IS ${archived ? 'NOT NULL' : 'NULL'}
     GROUP BY rr.id
     ORDER BY ${archived ? 'rr.archived_at' : 'rr.created_at'} DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// PATCH /api/employer/candidates/:id/archive
router.patch('/candidates/:id/archive', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `UPDATE referral_requests SET archived_at = NOW()
     WHERE id = $1 AND requester_id = $2 AND archived_at IS NULL RETURNING id`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// PATCH /api/employer/candidates/:id/unarchive
router.patch('/candidates/:id/unarchive', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `UPDATE referral_requests SET archived_at = NULL
     WHERE id = $1 AND requester_id = $2 AND archived_at IS NOT NULL RETURNING id`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// DELETE /api/employer/candidates/:id — only allowed if archived
router.delete('/candidates/:id', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `DELETE FROM referral_requests
     WHERE id = $1 AND requester_id = $2 AND archived_at IS NOT NULL RETURNING id`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(400).json({ error: 'Only archived candidates can be deleted' });
  res.json({ success: true });
});

// GET /api/employer/jobs
router.get('/jobs', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `SELECT * FROM jobs WHERE employer_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/employer/jobs
router.post('/jobs', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const { title, description } = req.body;
  const result = await db.query(
    `INSERT INTO jobs (employer_id, title, description) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.id, title, description]
  );
  res.json(result.rows[0]);
});

module.exports = router;
