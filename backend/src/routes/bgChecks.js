const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendBgCheckInvite, sendBgCheckSubmitted, sendBgCheckDeclined, sendReferrerInvite } = require('../services/email');

const { getCompanyMemberIds } = require('../utils/company');

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
  const { candidateName, candidateEmail, targetRole, includeReference, includeEducation, includeCriminal, includeEmployment, deadlineDays } = req.body;

  if (!candidateName || !candidateEmail) return res.status(400).json({ error: 'Candidate name and email are required' });
  if (!includeReference && !includeEducation && !includeCriminal && !includeEmployment) {
    return res.status(400).json({ error: 'Select at least one check type' });
  }

  const days = Math.max(1, Math.min(90, parseInt(deadlineDays) || 7));

  const result = await db.query(
    `INSERT INTO background_checks
       (employer_id, candidate_name, candidate_email, target_role,
        include_reference, include_education, include_criminal, include_employment,
        deadline_days, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + ($9::int * INTERVAL '1 day'))
     RETURNING *`,
    [req.user.id, candidateName, candidateEmail, targetRole || null,
     !!includeReference, !!includeEducation, !!includeCriminal, !!includeEmployment, days]
  );

  const check = result.rows[0];
  const employer = await db.query('SELECT name, email, company FROM users WHERE id = $1', [req.user.id]);

  sendBgCheckInvite(
    { name: candidateName, email: candidateEmail, role: targetRole },
    employer.rows[0],
    check.token,
    { reference: !!includeReference, education: !!includeEducation, criminal: !!includeCriminal, employment: !!includeEmployment },
    days
  ).catch(err => console.error('[bg check invite failed]', err.message));

  res.status(201).json(check);
});

// GET /api/employer/bg-checks — company bg checks list
employerRouter.get('/bg-checks', auth, requireEmployer, async (req, res) => {
  const memberIds = req.query.owner === 'mine' ? [req.user.id] : await getCompanyMemberIds(req.user.id);
  const result = await db.query(
    `SELECT bc.*,
       u.name AS created_by_name,
       (SELECT COUNT(*) FROM referrers r
          JOIN referral_requests rr ON r.referral_request_id = rr.id
          WHERE rr.bg_check_id = bc.id) AS ref_total,
       (SELECT COUNT(*) FROM referrers r
          JOIN referral_requests rr ON r.referral_request_id = rr.id
          WHERE rr.bg_check_id = bc.id AND r.status = 'completed') AS ref_completed
     FROM background_checks bc
     LEFT JOIN users u ON u.id = bc.employer_id
     WHERE bc.employer_id = ANY($1::uuid[])
     ORDER BY bc.created_at DESC`,
    [memberIds]
  );

  res.json(result.rows.map(r => ({ ...r, status: computedStatus(r) })));
});

// GET /api/employer/bg-checks/:id — detail view
employerRouter.get('/bg-checks/:id', auth, requireEmployer, async (req, res) => {
  const memberIds = await getCompanyMemberIds(req.user.id);
  const checkResult = await db.query(
    `SELECT bc.* FROM background_checks bc
     WHERE bc.id = $1 AND bc.employer_id = ANY($2::uuid[])`,
    [req.params.id, memberIds]
  );
  if (!checkResult.rows.length) return res.status(404).json({ error: 'Not found' });

  const check = { ...checkResult.rows[0], status: computedStatus(checkResult.rows[0]) };

  const [education, employment, criminal, referralReq] = await Promise.all([
    db.query('SELECT * FROM bg_education_entries  WHERE check_id = $1 ORDER BY graduation_year DESC NULLS LAST', [check.id]),
    db.query('SELECT * FROM bg_employment_entries WHERE check_id = $1 ORDER BY start_year DESC NULLS LAST, start_month DESC NULLS LAST', [check.id]),
    db.query('SELECT * FROM bg_criminal_data      WHERE check_id = $1', [check.id]),
    db.query('SELECT * FROM referral_requests     WHERE bg_check_id = $1', [check.id]),
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
    employment: employment.rows,
    criminal: criminal.rows[0] || null,
    referrers: referrers.rows,
  });
});

// PATCH /api/employer/bg-checks/:id — edit candidate details + check types (invited or in_progress only)
employerRouter.patch('/bg-checks/:id', auth, requireEmployer, async (req, res) => {
  const { candidateName, candidateEmail, targetRole, includeReference, includeEducation, includeCriminal, includeEmployment } = req.body;

  const memberIds = await getCompanyMemberIds(req.user.id);
  const existing = await db.query(
    `SELECT bc.*, u.name AS employer_name, u.email AS employer_email, u.company AS employer_company
     FROM background_checks bc
     JOIN users u ON u.id = bc.employer_id
     WHERE bc.id = $1 AND bc.employer_id = ANY($2::uuid[])`,
    [req.params.id, memberIds]
  );
  if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });

  const check = existing.rows[0];
  if (!['invited', 'in_progress'].includes(check.status)) {
    return res.status(409).json({ error: 'Cannot edit after candidate has submitted' });
  }

  const effRef  = includeReference  !== undefined ? !!includeReference  : check.include_reference;
  const effEdu  = includeEducation  !== undefined ? !!includeEducation  : check.include_education;
  const effCrim = includeCriminal   !== undefined ? !!includeCriminal   : check.include_criminal;
  const effEmp  = includeEmployment !== undefined ? !!includeEmployment : check.include_employment;
  if (!effRef && !effEdu && !effCrim && !effEmp) {
    return res.status(400).json({ error: 'At least one check type must be selected' });
  }

  const emailChanged  = candidateEmail && candidateEmail !== check.candidate_email;
  const checksChanged =
    (includeReference  !== undefined && !!includeReference  !== check.include_reference)  ||
    (includeEducation  !== undefined && !!includeEducation  !== check.include_education)  ||
    (includeCriminal   !== undefined && !!includeCriminal   !== check.include_criminal)   ||
    (includeEmployment !== undefined && !!includeEmployment !== check.include_employment);

  const result = await db.query(
    `UPDATE background_checks
     SET candidate_name     = COALESCE($1, candidate_name),
         candidate_email    = COALESCE($2, candidate_email),
         target_role        = COALESCE($3, target_role),
         include_reference  = CASE WHEN $4::boolean IS NOT NULL THEN $4 ELSE include_reference  END,
         include_education  = CASE WHEN $5::boolean IS NOT NULL THEN $5 ELSE include_education  END,
         include_criminal   = CASE WHEN $6::boolean IS NOT NULL THEN $6 ELSE include_criminal   END,
         include_employment = CASE WHEN $7::boolean IS NOT NULL THEN $7 ELSE include_employment END
     WHERE id = $8
     RETURNING *`,
    [
      candidateName    || null,
      candidateEmail   || null,
      targetRole       || null,
      includeReference  !== undefined ? !!includeReference  : null,
      includeEducation  !== undefined ? !!includeEducation  : null,
      includeCriminal   !== undefined ? !!includeCriminal   : null,
      includeEmployment !== undefined ? !!includeEmployment : null,
      check.id,
    ]
  );

  if (emailChanged || checksChanged) {
    const updated = result.rows[0];
    sendBgCheckInvite(
      { name: updated.candidate_name, email: updated.candidate_email, role: updated.target_role },
      { name: check.employer_name, email: check.employer_email, company: check.employer_company },
      updated.token,
      { reference: updated.include_reference, education: updated.include_education, criminal: updated.include_criminal, employment: updated.include_employment },
      updated.deadline_days
    ).catch(err => console.error('[bg check resend failed]', err.message));
  }

  res.json(result.rows[0]);
});

// POST /api/employer/bg-checks/:id/referrers — add a referrer after candidate submission
employerRouter.post('/bg-checks/:id/referrers', auth, requireEmployer, async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const memberIds = await getCompanyMemberIds(req.user.id);
  const checkResult = await db.query(
    `SELECT bc.*, u.name AS employer_name, u.email AS employer_email,
            u.company AS employer_company, u.reminder_days
     FROM background_checks bc
     JOIN users u ON u.id = bc.employer_id
     WHERE bc.id = $1 AND bc.employer_id = ANY($2::uuid[])`,
    [req.params.id, memberIds]
  );
  if (!checkResult.rows.length) return res.status(404).json({ error: 'Not found' });

  const check = checkResult.rows[0];
  if (!check.include_reference) {
    return res.status(400).json({ error: 'This check does not include reference checks' });
  }

  const rrResult = await db.query(
    `SELECT * FROM referral_requests WHERE bg_check_id = $1`,
    [check.id]
  );
  if (!rrResult.rows.length) {
    return res.status(409).json({ error: 'Candidate has not yet submitted their references. Add more referrers once they complete their intake.' });
  }

  const referralRequest = rrResult.rows[0];
  const refResult = await db.query(
    `INSERT INTO referrers (referral_request_id, name, email) VALUES ($1, $2, $3) RETURNING *`,
    [referralRequest.id, name, email]
  );
  const referrer = refResult.rows[0];

  const employer = {
    name: check.employer_name, email: check.employer_email,
    company: check.employer_company, reminder_days: check.reminder_days || 0,
  };
  sendReferrerInvite(referrer, referralRequest, employer, check.reminder_days || 0)
    .catch(err => console.error('[add referrer invite failed]', err.message));

  res.status(201).json(referrer);
});

// PATCH /api/employer/bg-checks/:id/employment/:entryId — update employment verification
employerRouter.patch('/bg-checks/:id/employment/:entryId', auth, requireEmployer, async (req, res) => {
  const { verificationStatus, contactPerson, contactRole, contactPhone, verificationNotes } = req.body;
  const allowed = ['pending', 'verifying', 'verified', 'discrepancy', 'unable_to_reach'];
  if (!allowed.includes(verificationStatus)) return res.status(400).json({ error: 'Invalid verification status' });

  const memberIds = await getCompanyMemberIds(req.user.id);
  const own = await db.query(
    `SELECT bc.id FROM background_checks bc
     WHERE bc.id = $1 AND bc.employer_id = ANY($2::uuid[])`,
    [req.params.id, memberIds]
  );
  if (!own.rows.length) return res.status(404).json({ error: 'Not found' });

  const result = await db.query(
    `UPDATE bg_employment_entries
     SET verification_status = $1,
         contact_person      = $2,
         contact_role        = $3,
         contact_phone       = $4,
         verification_notes  = $5,
         verified_at = CASE WHEN $8 THEN NOW() ELSE verified_at END
     WHERE id = $6 AND check_id = $7
     RETURNING *`,
    [verificationStatus, contactPerson || null, contactRole || null,
     contactPhone || null, verificationNotes || null,
     req.params.entryId, req.params.id, verificationStatus === 'verified']
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Entry not found' });

  res.json(result.rows[0]);
});

// PATCH /api/employer/bg-checks/:id/education/:entryId — verify/flag an education entry
employerRouter.patch('/bg-checks/:id/education/:entryId', auth, requireEmployer, async (req, res) => {
  const { verificationStatus, contactPerson, contactRole, contactPhone, verificationNotes } = req.body;
  const allowed = ['pending', 'verifying', 'verified', 'discrepancy', 'unable_to_reach'];
  if (!allowed.includes(verificationStatus)) return res.status(400).json({ error: 'Invalid verification status' });

  const memberIds = await getCompanyMemberIds(req.user.id);
  const own = await db.query(
    'SELECT id FROM background_checks WHERE id = $1 AND employer_id = ANY($2::uuid[])',
    [req.params.id, memberIds]
  );
  if (!own.rows.length) return res.status(404).json({ error: 'Not found' });

  const result = await db.query(
    `UPDATE bg_education_entries
     SET verification_status = $1,
         contact_person      = $2,
         contact_role        = $3,
         contact_phone       = $4,
         verification_notes  = $5,
         verified_at = CASE WHEN $8 THEN NOW() ELSE verified_at END
     WHERE id = $6 AND check_id = $7
     RETURNING *`,
    [verificationStatus, contactPerson || null, contactRole || null, contactPhone || null,
     verificationNotes || null, req.params.entryId, req.params.id, verificationStatus === 'verified']
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Entry not found' });

  res.json(result.rows[0]);
});

// ── public candidate routes ───────────────────────────────────────────────────

// GET /api/bg/:token — load the candidate intake form
publicRouter.get('/:token', async (req, res) => {
  const result = await db.query(
    `SELECT bc.candidate_name, bc.candidate_email, bc.target_role,
            bc.include_reference, bc.include_education, bc.include_criminal, bc.include_employment,
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
  const { references = [], education = [], employment = [], criminal = null } = req.body;

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
  if (check.include_employment && employment.length === 0) {
    return res.status(400).json({ error: 'Please add at least one employment entry' });
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

    // Employment entries
    for (const e of employment) {
      await client.query(
        `INSERT INTO bg_employment_entries
           (check_id, employer_name, job_title, start_year, start_month,
            end_year, end_month, is_current, supervisor_name, supervisor_contact, reason_for_leaving)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [check.id, e.employerName, e.jobTitle,
         e.startYear || null, e.startMonth || null,
         e.isCurrent ? null : (e.endYear || null),
         e.isCurrent ? null : (e.endMonth || null),
         !!e.isCurrent,
         e.supervisorName || null, e.supervisorContact || null, e.reasonForLeaving || null]
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
