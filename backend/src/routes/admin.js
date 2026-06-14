const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function adminOnly(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// GET /api/admin/employers — list all employers with stats
router.get('/employers', auth, adminOnly, async (req, res) => {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.company, u.subscription_plan,
            u.terms_accepted_at, u.is_active, u.created_at,
            COUNT(DISTINCT rr.id) AS total_requests,
            COUNT(DISTINCT rr.id) FILTER (WHERE rr.archived_at IS NULL) AS active_requests
     FROM users u
     LEFT JOIN referral_requests rr ON rr.requester_id = u.id
     WHERE u.role = 'employer' AND u.is_admin = false
     GROUP BY u.id
     ORDER BY u.is_active DESC, u.created_at DESC`
  );
  res.json(result.rows);
});

// GET /api/admin/employers/:id/candidates — view any employer's pipeline
router.get('/employers/:id/candidates', auth, adminOnly, async (req, res) => {
  const result = await db.query(
    `SELECT rr.*,
       COUNT(DISTINCT rf.id) AS total_referrers,
       COUNT(DISTINCT rf.id) FILTER (WHERE rf.submitted_at IS NOT NULL) AS completed_referrers
     FROM referral_requests rr
     LEFT JOIN referrers rf ON rf.referral_request_id = rr.id
     WHERE rr.requester_id = $1 AND rr.archived_at IS NULL
     GROUP BY rr.id
     ORDER BY rr.created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});

// POST /api/admin/employers/:id/referrals — create referral on behalf of employer
router.post('/employers/:id/referrals', auth, adminOnly, async (req, res) => {
  const { targetRole, referrers, candidateName, candidateEmail } = req.body;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const reqResult = await client.query(
      `INSERT INTO referral_requests (requester_id, requester_role, candidate_name, candidate_email, target_role)
       VALUES ($1, 'employer', $2, $3, $4) RETURNING *`,
      [req.params.id, candidateName || null, candidateEmail || null, targetRole || null]
    );
    const referralRequest = reqResult.rows[0];
    for (const r of referrers) {
      await client.query(
        `INSERT INTO referrers (referral_request_id, name, email) VALUES ($1, $2, $3)`,
        [referralRequest.id, r.name, r.email]
      );
    }
    await client.query('COMMIT');
    res.json(referralRequest);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/employers/:id/deactivate
router.patch('/employers/:id/deactivate', auth, adminOnly, async (req, res) => {
  const result = await db.query(
    `UPDATE users SET is_active = false
     WHERE id = $1 AND role = 'employer' AND is_admin = false AND is_active = true RETURNING id`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Employer not found or already deactivated' });
  res.json({ success: true });
});

// PATCH /api/admin/employers/:id/activate
router.patch('/employers/:id/activate', auth, adminOnly, async (req, res) => {
  const result = await db.query(
    `UPDATE users SET is_active = true
     WHERE id = $1 AND role = 'employer' AND is_active = false RETURNING id`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Employer not found or already active' });
  res.json({ success: true });
});

// DELETE /api/admin/employers/:id — only allowed if deactivated
router.delete('/employers/:id', auth, adminOnly, async (req, res) => {
  const result = await db.query(
    `DELETE FROM users WHERE id = $1 AND role = 'employer' AND is_active = false RETURNING id`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(400).json({ error: 'Only deactivated employer accounts can be deleted' });
  res.json({ success: true });
});

// GET /api/admin/stats — platform-wide numbers
router.get('/stats', auth, adminOnly, async (req, res) => {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'employer' AND is_admin = false) AS total_employers,
      (SELECT COUNT(*) FROM users WHERE role = 'jobseeker') AS total_jobseekers,
      (SELECT COUNT(*) FROM referral_requests) AS total_requests,
      (SELECT COUNT(*) FROM referrers WHERE submitted_at IS NOT NULL) AS total_submissions,
      (SELECT COUNT(*) FROM reports) AS total_reports
  `);
  res.json(result.rows[0]);
});

module.exports = router;
