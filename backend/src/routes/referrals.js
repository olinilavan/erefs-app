const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendReferrerInvite } = require('../services/email');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const PERSONAL_DOMAINS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
  'icloud.com','aol.com','mail.com','protonmail.com','ymail.com',
  'msn.com','me.com','mac.com','googlemail.com','yahoo.co.uk',
]);

function isPersonalEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? PERSONAL_DOMAINS.has(domain) : false;
}

async function checkWorkEmailPolicy(userId, emails) {
  const result = await db.query(`SELECT require_work_email FROM users WHERE id = $1`, [userId]);
  if (!result.rows[0]?.require_work_email) return null;
  const personal = emails.filter(isPersonalEmail);
  return personal.length > 0
    ? `Work email required. Personal email not allowed: ${personal.join(', ')}`
    : null;
}

// POST /api/referrals — create a new referral request + send emails to referrers
router.post('/', auth, async (req, res) => {
  const { targetRole, referrers, candidateName, candidateEmail, jobId } = req.body;
  const policyError = await checkWorkEmailPolicy(req.user.id, (referrers || []).map(r => r.email));
  if (policyError) return res.status(400).json({ error: policyError });
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const reqResult = await client.query(
      `INSERT INTO referral_requests (requester_id, requester_role, candidate_name, candidate_email, job_id, target_role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, req.user.role, candidateName || null, candidateEmail || null, jobId || null, targetRole || null]
    );
    const referralRequest = reqResult.rows[0];

    const createdReferrers = [];
    for (const r of referrers) {
      const refResult = await client.query(
        `INSERT INTO referrers (referral_request_id, name, email) VALUES ($1, $2, $3) RETURNING *`,
        [referralRequest.id, r.name, r.email]
      );
      const referrer = refResult.rows[0];
      createdReferrers.push(referrer);
      await sendReferrerInvite(referrer, referralRequest, req.user);
    }

    await client.query('COMMIT');
    res.json({ referralRequest, referrers: createdReferrers });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/referrals — list requester's referral requests
router.get('/', auth, async (req, res) => {
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

// GET /api/referrals/:id
router.get('/:id', auth, async (req, res) => {
  const isAdmin = req.user.is_admin;
  const result = await db.query(
    `SELECT rr.*, rf.id AS referrer_id, rf.name AS referrer_name, rf.email AS referrer_email,
            rf.token, rf.submitted_at, rf.created_at AS referrer_created_at, rep.id AS report_id
     FROM referral_requests rr
     LEFT JOIN referrers rf ON rf.referral_request_id = rr.id
     LEFT JOIN reports rep ON rep.referrer_id = rf.id
     WHERE rr.id = $1 AND ($2 OR rr.requester_id = $3)
     ORDER BY rf.created_at ASC`,
    [req.params.id, isAdmin, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows);
});

// POST /api/referrals/:id/referrers — add a referrer to an existing request
router.post('/:id/referrers', auth, async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const ownerCheck = await db.query(
    `SELECT id FROM referral_requests WHERE id = $1 AND ($2 OR requester_id = $3)`,
    [req.params.id, req.user.is_admin, req.user.id]
  );
  if (!ownerCheck.rows.length) return res.status(404).json({ error: 'Not found' });

  const policyError = await checkWorkEmailPolicy(req.user.id, [email]);
  if (policyError) return res.status(400).json({ error: policyError });

  const result = await db.query(
    `INSERT INTO referrers (referral_request_id, name, email) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, name, email]
  );
  const referrer = result.rows[0];

  const rrResult = await db.query(`SELECT * FROM referral_requests WHERE id = $1`, [req.params.id]);
  const requester = await db.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
  await sendReferrerInvite(referrer, rrResult.rows[0], requester.rows[0]);

  res.json(referrer);
});

module.exports = router;
