const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendBgCheckInvite, sendBgCheckSubmitted, sendBgCheckDeclined, sendReferrerInvite } = require('../services/email');

const employerRouter = express.Router();
const publicRouter  = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────

function requireEmployer(req, res, next) {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Employer only' });
  next();
}

function computedStatus(row) {
  if (row.status === 'invited' && row.expires_at && new Date(row.expires_at) < new Date()) {
    return 'expired';
  }
  return row.status;
}

// ── employer routes ───────────────────────────────────────────────────────────

// POST /api/employer/bg-checks — initiate a background check
employerRouter.post('/bg-checks', auth, requireEmployer, async (req, res) => {
  const { candidateName, candidateEmail, targetRole, includeReference, includeEducation, includeCriminal, deadlineDays } = req.body;

  if (!candidateName || !candidateEmail) return res.status(400).json({ error: 'Candidate name and email are required' });
  if (!includeReference && !includeEducation && !includeCriminal) {
    return res.status(400).json({ error: 'Select at least one check type' });
  }

  const days = Math.max(1, Math.min(90, parseInt(deadlineDays) || 7));

  const result = await db.query(
    `INSERT INTO background_checks
       (employer_id, candidate_name, candidate_email, target_role,
        include_reference, include_education, include_criminal,
        deadline_days, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + ($8::int * INTERVAL '1 day'))
     RETURNING *`,
    [req.user.id, candidateName, candidateEmail, targetRole || null,
     !!includeReference, !!includeEducation, !!includeCriminal, days]
  );

  const check = result.rows[0];
  const employer = await db.query('SELECT name, email, company FROM users WHERE id = $1', [req.user.id]);

  sendBgCheckInvite(
    { name: candidateName, email: candidateEmail, role: targetRole },
    employer.rows[0],
    check.token,
    { reference: !!includeReference, education: !!includeEducation, criminal: !!includeCriminal },
    days
  ).catch(err => console.error('[bg check invite failed]', err.message));

  res.status(201).json(check);
});

// GET /api/employer/bg-checks — list all bg checks for this employer
employerRouter.get('/bg-checks', auth, requireEmployer, async (req, res) => {
  const result = await db.query(
    `SELECT bc.*,
       (SELECT COUNT(*) FROM referrers r
          JOIN referral_requests rr ON r.referral_request_id = rr.id
          WHERE rr.bg_check_id = bc.id) AS ref_total,
       (SELECT COUNT(*) FROM referrers r
          JOIN referral_requests rr ON r.referral_request_id = rr.id
          WHERE rr.bg_check_id = bc.id AND r.status = 'completed') AS ref_completed
     FROM background_checks bc
     WHERE bc.employer_id = $1
     ORDER BY bc.created_at DESC`,
    [req.user.id]
  );

  res.json(result.rows.map(r => ({ ...r, status: computedStatus(r) })));
});

// GET /api/employer/bg-checks/:id — detail view
employerRouter.get('/bg-checks/:id', auth, requireEmployer, async (req, res) => {
  const checkResult = await db.query(
    `SELECT bc.* FROM background_checks bc
     WHERE bc.id = $1 AND bc.employer_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!checkResult.rows.length) return res.status(404).json({ error: 'Not found' });

  const check = { ...checkResult.rows[0], status: computedStatus(checkResult.rows[0]) };

  const [education, criminal, referralReq] = await Promise.all([
    db.query('SELECT * FROM bg_education_entries WHERE check_id = $1 ORDER BY graduation_year DESC NULLS LAST', [check.id]),
    db.query('SELECT * FROM bg_criminal_data WHERE check_id = $1', [check.id]),
    db.query('SELECT * FROM referral_requests WHERE bg_check_id = $1', [check.id]),
  ]);

  let referrers = { rows: [] };
  if (referralReq.rows.length) {
    referrers = await db.query(
      `SELECT * FROM referrers WHERE referral_request_id = $1 ORDER BY created_at`,
      [referralReq.rows[0].id]
    );
  }

  res.json({
    check,
    education: education.rows,
    criminal: criminal.rows[0] || null,
    referrers: referrers.rows,
  });
});

// PATCH /api/employer/bg-checks/:id/education/:entryId — verify/flag an education entry
employerRouter.patch('/bg-checks/:id/education/:entryId', auth, requireEmployer, async (req, res) => {
  const { verificationStatus, verificationNotes } = req.body;
  const allowed = ['pending', 'verifying', 'verified', 'discrepancy'];
  if (!allowed.includes(verificationStatus)) return res.status(400).json({ error: 'Invalid verification status' });

  // Verify the check belongs to this employer
  const own = await db.query(
    'SELECT id FROM background_checks WHERE id = $1 AND employer_id = $2',
    [req.params.id, req.user.id]
  );
  if (!own.rows.length) return res.status(404).json({ error: 'Not found' });

  const result = await db.query(
    `UPDATE bg_education_entries
     SET verification_status = $1,
         verification_notes  = $2,
         verified_at = CASE WHEN $1 = 'verified' THEN NOW() ELSE verified_at END
     WHERE id = $3 AND check_id = $4
     RETURNING *`,
    [verificationStatus, verificationNotes || null, req.params.entryId, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Entry not found' });

  res.json(result.rows[0]);
});

// ── public candidate routes ───────────────────────────────────────────────────

// GET /api/bg/:token — load the candidate intake form
publicRouter.get('/:token', async (req, res) => {
  const result = await db.query(
    `SELECT bc.candidate_name, bc.candidate_email, bc.target_role,
            bc.include_reference, bc.include_education, bc.include_criminal,
            bc.status, bc.expires_at, bc.deadline_days,
            u.name AS employer_name, u.company AS employer_company
     FROM background_checks bc
     JOIN users u ON u.id = bc.employer_id
     WHERE bc.token = $1`,
    [req.params.token]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Invalid link' });

  const row = result.rows[0];
  const status = computedStatus(row);

  if (status === 'expired')   return res.status(410).json({ error: 'This link has expired', status: 'expired' });
  if (status === 'submitted') return res.status(409).json({ error: 'Already submitted', status: 'submitted' });
  if (status === 'declined')  return res.status(409).json({ error: 'Already declined', status: 'declined' });

  // Mark as in_progress on first open
  if (status === 'invited') {
    await db.query(
      `UPDATE background_checks SET status = 'in_progress' WHERE token = $1 AND status = 'invited'`,
      [req.params.token]
    );
  }

  res.json({ ...row, status: status === 'invited' ? 'in_progress' : status });
});

// POST /api/bg/:token/submit — candidate submits all info
publicRouter.post('/:token/submit', async (req, res) => {
  const { references = [], education = [], criminal = null } = req.body;

  const checkResult = await db.query(
    `SELECT bc.*, u.name AS employer_name, u.email AS employer_email,
            u.company AS employer_company, u.reminder_days, u.share_link_expiry_days
     FROM background_checks bc
     JOIN users u ON u.id = bc.employer_id
     WHERE bc.token = $1`,
    [req.params.token]
  );
  if (!checkResult.rows.length) return res.status(404).json({ error: 'Invalid link' });

  const check = checkResult.rows[0];
  const status = computedStatus(check);

  if (status === 'expired')   return res.status(410).json({ error: 'This link has expired' });
  if (status === 'submitted') return res.status(409).json({ error: 'Already submitted' });
  if (status === 'declined')  return res.status(409).json({ error: 'Already declined' });

  // Validate required sections
  if (check.include_reference && references.length < 2) {
    return res.status(400).json({ error: 'Please provide at least 2 references' });
  }
  if (check.include_education && education.length === 0) {
    return res.status(400).json({ error: 'Please add at least one education entry' });
  }
  if (check.include_criminal && (!criminal || !criminal.consentGiven)) {
    return res.status(400).json({ error: 'Criminal check consent is required' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Update bg check to submitted
    await client.query(
      `UPDATE background_checks SET status = 'submitted', submitted_at = NOW() WHERE id = $1`,
      [check.id]
    );

    // Education entries
    for (const e of education) {
      await client.query(
        `INSERT INTO bg_education_entries
           (check_id, institution, degree_type, field_of_study, start_year, graduation_year, gpa)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [check.id, e.institution, e.degreeType, e.fieldOfStudy || null,
         e.startYear || null, e.graduationYear || null, e.gpa || null]
      );
    }

    // Criminal data
    if (criminal && check.include_criminal) {
      await client.query(
        `INSERT INTO bg_criminal_data (check_id, consent_given, consent_at, address, date_of_birth)
         VALUES ($1, $2, NOW(), $3, $4)`,
        [check.id, !!criminal.consentGiven, criminal.address || null, criminal.dateOfBirth || null]
      );
    }

    // Reference check: create referral_request + referrers
    let createdReferrers = [];
    if (check.include_reference && references.length > 0) {
      const shareExpiry = check.share_link_expiry_days || 14;
      const rrResult = await client.query(
        `INSERT INTO referral_requests
           (requester_id, requester_role, candidate_name, candidate_email, target_role,
            bg_check_id, share_token_expires_at)
         VALUES ($1, 'employer', $2, $3, $4, $5, NOW() + ($6::int * INTERVAL '1 day'))
         RETURNING *`,
        [check.employer_id, check.candidate_name, check.candidate_email,
         check.target_role, check.id, shareExpiry]
      );
      const referralRequest = rrResult.rows[0];

      for (const r of references) {
        const refResult = await client.query(
          `INSERT INTO referrers (referral_request_id, name, email) VALUES ($1, $2, $3) RETURNING *`,
          [referralRequest.id, r.name, r.email]
        );
        createdReferrers.push(refResult.rows[0]);
      }

      // Send referrer invites outside the transaction
      const employer = {
        name: check.employer_name,
        email: check.employer_email,
        company: check.employer_company,
        reminder_days: check.reminder_days || 0,
      };
      for (const referrer of createdReferrers) {
        sendReferrerInvite(referrer, referralRequest, employer, check.reminder_days || 0)
          .catch(err => console.error('[bg check referrer invite failed]', err.message));
      }
    }

    await client.query('COMMIT');

    // Notify employer
    sendBgCheckSubmitted(
      { name: check.employer_name, email: check.employer_email },
      { name: check.candidate_name, role: check.target_role, checkId: check.id }
    ).catch(err => console.error('[bg check submitted notify failed]', err.message));

    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[bg check submit error]', err);
    res.status(500).json({ error: 'Submission failed — please try again' });
  } finally {
    client.release();
  }
});

// POST /api/bg/:token/decline — candidate declines
publicRouter.post('/:token/decline', async (req, res) => {
  const result = await db.query(
    `UPDATE background_checks SET status = 'declined', declined_at = NOW()
     WHERE token = $1 AND status IN ('invited', 'in_progress')
     RETURNING id, candidate_name, target_role, employer_id`,
    [req.params.token]
  );
  if (!result.rows.length) return res.status(409).json({ error: 'Cannot decline at this stage' });

  const check = result.rows[0];
  const employer = await db.query('SELECT name, email, company FROM users WHERE id = $1', [check.employer_id]);

  sendBgCheckDeclined(
    employer.rows[0],
    { name: check.candidate_name, role: check.target_role, checkId: check.id }
  ).catch(err => console.error('[bg check declined notify failed]', err.message));

  res.json({ ok: true });
});

module.exports = { employerRouter, publicRouter };
