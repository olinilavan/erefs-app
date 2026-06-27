const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendEmployerContactRequest } = require('../services/email');
const { matchCandidatesToJob } = require('../services/matching');

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

// GET /api/employer/jobs — employer's own postings, with applicant counts
router.get('/jobs', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `SELECT j.*, COUNT(ja.id) AS applicant_count
     FROM jobs j
     LEFT JOIN job_applications ja ON ja.job_id = j.id
     WHERE j.employer_id = $1
     GROUP BY j.id
     ORDER BY j.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/employer/jobs
router.post('/jobs', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const { title, description, location, workRequirement, isPublic, expiresAt } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const result = await db.query(
    `INSERT INTO jobs (employer_id, title, description, location, work_requirement, is_public, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.id, title, description || null, location || null, workRequirement || null, !!isPublic, expiresAt || null]
  );
  res.json(result.rows[0]);
});

// PATCH /api/employer/jobs/:id — edit a posting (including toggling is_public, expiry, or closing it)
router.patch('/jobs/:id', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const { title, description, location, workRequirement, isPublic, status, expiresAt } = req.body;
  const result = await db.query(
    `UPDATE jobs
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         location = COALESCE($3, location),
         work_requirement = COALESCE($4, work_requirement),
         is_public = COALESCE($5, is_public),
         status = COALESCE($6, status),
         expires_at = COALESCE($7, expires_at)
     WHERE id = $8 AND employer_id = $9
     RETURNING *`,
    [title, description, location, workRequirement, isPublic, status, expiresAt, req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// DELETE /api/employer/jobs/:id — also removes its applications (FK cascade)
router.delete('/jobs/:id', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `DELETE FROM jobs WHERE id = $1 AND employer_id = $2 RETURNING id`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// POST /api/employer/jobs/:id/flash — request paid featured home-page placement.
// Payment is manual for now: this just flags the request; an admin confirms payment
// externally and activates it from the admin queue.
router.post('/jobs/:id/flash', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `UPDATE jobs SET flash_status = 'pending_payment', flash_requested_at = NOW()
     WHERE id = $1 AND employer_id = $2 AND (flash_status IS NULL OR flash_status != 'active')
     RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(400).json({ error: 'Not found, or already an active Flash Job' });
  res.json(result.rows[0]);
});

// GET /api/employer/jobs/:id/applicants
router.get('/jobs/:id/applicants', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const jobCheck = await db.query(`SELECT id, title FROM jobs WHERE id = $1 AND employer_id = $2`, [req.params.id, req.user.id]);
  if (!jobCheck.rows.length) return res.status(404).json({ error: 'Not found' });

  const result = await db.query(
    `SELECT id, applicant_name, applicant_email, resume_url, resume_text, message, created_at,
            fit_score, fit_rationale, fit_evaluated_at
     FROM job_applications WHERE job_id = $1 ORDER BY created_at DESC`,
    [req.params.id]
  );
  res.json({ job: jobCheck.rows[0], applicants: result.rows });
});

// POST /api/employer/jobs/:id/match-candidates — on-demand only, never automatic.
// Ranks current applicants against the job via the LLM and caches the result on
// job_applications so re-viewing the page doesn't re-trigger a Groq call.
router.post('/jobs/:id/match-candidates', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const jobCheck = await db.query(`SELECT * FROM jobs WHERE id = $1 AND employer_id = $2`, [req.params.id, req.user.id]);
  if (!jobCheck.rows.length) return res.status(404).json({ error: 'Not found' });
  const job = jobCheck.rows[0];

  const applicantsResult = await db.query(
    `SELECT id, resume_text, message FROM job_applications WHERE job_id = $1`,
    [req.params.id]
  );
  if (!applicantsResult.rows.length) return res.status(400).json({ error: 'No applicants to match yet' });

  let matches;
  try {
    matches = await matchCandidatesToJob(job, applicantsResult.rows);
  } catch (err) {
    console.error('[matchCandidatesToJob failed]', err.message);
    return res.status(502).json({ error: 'AI matching failed — please try again' });
  }

  for (const m of matches) {
    await db.query(
      `UPDATE job_applications SET fit_score = $1, fit_rationale = $2, fit_evaluated_at = NOW() WHERE id = $3 AND job_id = $4`,
      [m.fitScore, [m.rationale, ...(m.concerns?.length ? [`Concerns: ${m.concerns.join(', ')}`] : [])].join(' '), m.id, req.params.id]
    );
  }

  const result = await db.query(
    `SELECT id, applicant_name, applicant_email, resume_url, resume_text, message, created_at,
            fit_score, fit_rationale, fit_evaluated_at
     FROM job_applications WHERE job_id = $1 ORDER BY fit_score DESC NULLS LAST`,
    [req.params.id]
  );
  res.json({ job, applicants: result.rows });
});

const TALENT_PAGE_SIZE = 20;

// GET /api/employer/talent?page=1 — anonymized, paginated directory of jobseekers open to employer contact
router.get('/talent', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * TALENT_PAGE_SIZE;

  const result = await db.query(
    `SELECT u.vm_id, u.headline, u.years_experience, u.location, u.availability,
       EXISTS (
         SELECT 1 FROM reports rep
         JOIN referrers rf ON rf.id = rep.referrer_id
         JOIN referral_requests rr ON rr.id = rf.referral_request_id
         WHERE rr.requester_id = u.id
       ) AS reference_complete,
       EXISTS (
         SELECT 1 FROM contact_requests cr WHERE cr.employer_id = $1 AND cr.jobseeker_id = u.id
       ) AS already_contacted,
       COUNT(*) OVER() AS total_count
     FROM users u
     WHERE u.role = 'jobseeker' AND u.publicly_discoverable = true AND u.allow_employer_contact = true
       AND u.headline IS NOT NULL AND u.headline != ''
     ORDER BY u.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, TALENT_PAGE_SIZE, offset]
  );

  const totalCount = result.rows[0]?.total_count ? parseInt(result.rows[0].total_count) : 0;
  const candidates = result.rows.map(({ total_count, ...rest }) => rest);

  res.json({
    candidates,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / TALENT_PAGE_SIZE)),
    totalCount,
  });
});

// POST /api/employer/talent/:vmId/contact — brokered outreach (employer's contact info emailed to jobseeker)
// Keyed by VM ID (the only identifier ever shown publicly), not the internal user id.
router.post('/talent/:vmId/contact', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const { phone, message } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const jobseekerResult = await db.query(
    `SELECT id, name, email FROM users WHERE vm_id = $1 AND role = 'jobseeker' AND allow_employer_contact = true`,
    [req.params.vmId]
  );
  if (!jobseekerResult.rows.length) return res.status(404).json({ error: 'Not found' });
  const jobseeker = jobseekerResult.rows[0];

  const employerResult = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [req.user.id]);
  const employer = employerResult.rows[0];

  try {
    await db.query(
      `INSERT INTO contact_requests (employer_id, jobseeker_id, employer_name, employer_email, employer_phone, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, jobseeker.id, employer.name, employer.email, phone, message || null]
    );
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'You have already reached out to this candidate' });
    throw err;
  }

  await sendEmployerContactRequest(jobseeker, employer, phone, message);
  res.json({ success: true });
});

module.exports = router;
