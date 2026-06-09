const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/employer/candidates — list all referral requests for employer's jobs
router.get('/candidates', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `SELECT rr.*,
       COUNT(DISTINCT rf.id) AS total_referrers,
       COUNT(DISTINCT rf.id) FILTER (WHERE rf.submitted_at IS NOT NULL) AS completed_referrers
     FROM referral_requests rr
     LEFT JOIN referrers rf ON rf.referral_request_id = rr.id
     WHERE rr.requester_id = $1
     GROUP BY rr.id
     ORDER BY rr.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
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
