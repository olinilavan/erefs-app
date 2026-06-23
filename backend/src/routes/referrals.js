const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendReferrerInvite, sendCandidateProfileInvite } = require('../services/email');
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
//
// Jobseeker flow stays lightweight: Reference Check only, plus an optional resume link.
// Employer flow additionally seeds the candidate-token invite (Professional Background
// Check — currently a placeholder pending the structured education/experience rebuild).
router.post('/', auth, async (req, res) => {
  const { targetRole, referrers, candidateName, candidateEmail, jobId, candidateLinkedInUrl, resumeUrl } = req.body;
  const policyError = await checkWorkEmailPolicy(req.user.id, (referrers || []).map(r => r.email));
  if (policyError) return res.status(400).json({ error: policyError });
  const { rows: [userRow] } = await db.query(
    `SELECT email, reminder_days, resume_url, share_link_expiry_days FROM users WHERE id = $1`,
    [req.user.id]
  );
  const reminderDays = userRow?.reminder_days || 0;
  const shareExpiryDays = userRow?.share_link_expiry_days || 14;
  const isEmployer = req.user.role === 'employer';

  // Jobseeker: use the resume link provided on this form, falling back to their saved profile link.
  const effectiveResumeUrl = isEmployer ? null : (resumeUrl || userRow?.resume_url || null);

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Professional Background Check candidate invite — employer flow only.
    let candidateToken = null;
    if (isEmployer && candidateEmail) {
      candidateToken = uuidv4();
    }

    const reqResult = await client.query(
      `INSERT INTO referral_requests
         (requester_id, requester_role, candidate_name, candidate_email, job_id, target_role,
          candidate_linkedin_url, resume_url, candidate_token, candidate_token_expires_at, share_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $9::uuid IS NULL THEN NULL ELSE NOW() + INTERVAL '30 days' END,
               NOW() + ($10 * INTERVAL '1 day'))
       RETURNING *`,
      [req.user.id, req.user.role, candidateName || null, candidateEmail || null, jobId || null, targetRole || null,
       isEmployer ? (candidateLinkedInUrl || null) : null, effectiveResumeUrl, candidateToken, shareExpiryDays]
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
      await sendReferrerInvite(referrer, referralRequest, req.user, reminderDays);
    }

    await client.query('COMMIT');
    res.json({ referralRequest, referrers: createdReferrers });

    if (candidateToken) {
      sendCandidateProfileInvite(referralRequest).catch((err) => {
        console.error('[sendCandidateProfileInvite failed]', err.message);
      });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/referrals/share/:shareToken — public, combined view of all completed reports
// for one referral request. Lets a candidate with multiple referrers share one link
// instead of N separate per-referrer report links.
router.get('/share/:shareToken', async (req, res) => {
  if (!UUID_RE.test(req.params.shareToken)) return res.status(404).json({ error: 'Invalid link' });

  const rrResult = await db.query(
    `SELECT rr.id, rr.candidate_name, rr.target_role, rr.share_token_expires_at,
            CASE WHEN rr.requester_role = 'jobseeker' THEN COALESCE(u.resume_url, rr.resume_url) ELSE NULL END AS resume_url
     FROM referral_requests rr
     LEFT JOIN users u ON u.id = rr.requester_id
     WHERE rr.share_token = $1`,
    [req.params.shareToken]
  );
  if (!rrResult.rows.length) return res.status(404).json({ error: 'Invalid link' });
  const rr = rrResult.rows[0];
  if (rr.share_token_expires_at && new Date(rr.share_token_expires_at) < new Date()) {
    return res.status(410).json({ error: 'expired' });
  }

  const reportsResult = await db.query(
    `SELECT rep.llm_output_json, rep.created_at, rf.name AS referrer_name
     FROM reports rep
     JOIN referrers rf ON rf.id = rep.referrer_id
     WHERE rf.referral_request_id = $1 AND rf.status = 'completed'
     ORDER BY rep.created_at ASC`,
    [rr.id]
  );

  res.json({
    candidate_name: rr.candidate_name,
    target_role: rr.target_role,
    resume_url: rr.resume_url,
    reports: reportsResult.rows,
  });
});

// GET /api/referrals — list requester's referral requests
router.get('/', auth, async (req, res) => {
  const result = await db.query(
    `SELECT rr.*,
       COUNT(DISTINCT rf.id) AS total_referrers,
       COUNT(DISTINCT rf.id) FILTER (WHERE rf.status = 'completed') AS completed_referrers
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
            rf.token, rf.submitted_at, rf.status AS referrer_status, rf.viewed_at,
            rf.created_at AS referrer_created_at, rep.id AS report_id,
            CASE WHEN rr.requester_role = 'jobseeker' THEN COALESCE(u.resume_url, rr.resume_url) ELSE NULL END AS resume_url
     FROM referral_requests rr
     LEFT JOIN users u ON u.id = rr.requester_id
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
  await sendReferrerInvite(referrer, rrResult.rows[0], requester.rows[0], requester.rows[0].reminder_days || 0);

  res.json(referrer);
});

module.exports = router;
