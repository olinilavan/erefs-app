const express = require('express');
const multer = require('multer');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendEmployerContactRequest, sendVendorLinkRequest, sendVendorLinkApproved, sendVendorLinkDeclined, sendVendorLinkRevoked, sendVendorSubmissionNotification } = require('../services/email');
const { matchCandidatesToJob } = require('../services/matching');
const { parseResumeFile } = require('../services/resumeParser');

const router = express.Router();

const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_RESUME_EXTENSIONS.includes(ext)) {
      return cb(new Error('Only .pdf, .doc, and .docx resumes are accepted'));
    }
    cb(null, true);
  },
});

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
// externally and activates it from the admin queue. Flash implies public — a
// Vendor Only posting going Flash is switched back to Open to Public.
router.post('/jobs/:id/flash', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `UPDATE jobs SET flash_status = 'pending_payment', flash_requested_at = NOW(), is_public = true
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

  const vendorResult = await db.query(
    `SELECT vs.id, vs.candidate_name, vs.candidate_email, vs.candidate_phone, vs.resume_text,
            vs.cover_note, vs.status, vs.created_at,
            u.company AS vendor_company, u.name AS vendor_name
     FROM vendor_submissions vs JOIN users u ON u.id = vs.vendor_employer_id
     WHERE vs.job_id = $1 ORDER BY vs.created_at DESC`,
    [req.params.id]
  );

  res.json({ job: jobCheck.rows[0], applicants: result.rows, vendorSubmissions: vendorResult.rows });
});

// PATCH /api/employer/jobs/:id/vendor-submissions/:submissionId — review status
router.patch('/jobs/:id/vendor-submissions/:submissionId', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  const VALID_STATUSES = ['submitted', 'reviewed', 'shortlisted', 'rejected', 'hired'];
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const result = await db.query(
    `UPDATE vendor_submissions vs SET status = $1, reviewed_at = NOW()
     FROM jobs j
     WHERE vs.id = $2 AND vs.job_id = $3 AND vs.job_id = j.id AND j.employer_id = $4
     RETURNING vs.*`,
    [status, req.params.submissionId, req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
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

// ── Vendor links — employer-to-employer, no separate vendor role ───────────
// "Vendor" is purely a relationship direction: any employer can request to
// become another employer's vendor. The buyer (job-posting company) approves
// or declines. Links are direct only — no transitive chaining.

// GET /api/employer/vendors/directory — other employer companies + my outgoing link status with each
router.get('/vendors/directory', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `SELECT u.id, u.name, u.company,
            l.status AS link_status
     FROM users u
     LEFT JOIN employer_vendor_links l
       ON l.buyer_employer_id = u.id AND l.vendor_employer_id = $1
     WHERE u.role = 'employer' AND u.id != $1 AND (u.is_active IS NULL OR u.is_active = true)
     ORDER BY u.company NULLS LAST, u.name`,
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/employer/vendors/request — I want to become buyerEmployerId's vendor
router.post('/vendors/request', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const { buyerEmployerId } = req.body;
  if (!buyerEmployerId) return res.status(400).json({ error: 'buyerEmployerId is required' });
  if (buyerEmployerId === req.user.id) return res.status(400).json({ error: 'You cannot link to yourself' });

  const buyerCheck = await db.query(`SELECT id FROM users WHERE id = $1 AND role = 'employer'`, [buyerEmployerId]);
  if (!buyerCheck.rows.length) return res.status(404).json({ error: 'Employer not found' });

  const result = await db.query(
    `INSERT INTO employer_vendor_links (buyer_employer_id, vendor_employer_id, status, requested_at)
     VALUES ($1, $2, 'pending', NOW())
     ON CONFLICT (buyer_employer_id, vendor_employer_id) DO UPDATE
       SET status = 'pending', requested_at = NOW(), revoked_at = NULL
       WHERE employer_vendor_links.status IN ('declined', 'revoked')
     RETURNING *`,
    [buyerEmployerId, req.user.id]
  );
  if (!result.rows.length) return res.status(400).json({ error: 'A request already exists with this employer' });

  const buyer = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [buyerEmployerId]);
  const vendor = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [req.user.id]);
  sendVendorLinkRequest(buyer.rows[0], vendor.rows[0]).catch(err => console.error('[vendor link email]', err.message));

  res.json(result.rows[0]);
});

// GET /api/employer/vendors/incoming — pending requests where I'm the buyer
router.get('/vendors/incoming', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `SELECT l.*, u.name AS vendor_name, u.company AS vendor_company, u.email AS vendor_email
     FROM employer_vendor_links l JOIN users u ON u.id = l.vendor_employer_id
     WHERE l.buyer_employer_id = $1 AND l.status = 'pending'
     ORDER BY l.requested_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// GET /api/employer/vendors/links — all my links, either side
router.get('/vendors/links', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `SELECT l.*,
            b.name AS buyer_name, b.company AS buyer_company,
            v.name AS vendor_name, v.company AS vendor_company
     FROM employer_vendor_links l
     JOIN users b ON b.id = l.buyer_employer_id
     JOIN users v ON v.id = l.vendor_employer_id
     WHERE l.buyer_employer_id = $1 OR l.vendor_employer_id = $1
     ORDER BY l.requested_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// DELETE /api/employer/vendors/links/:id — revoke an approved link, either side
router.delete('/vendors/links/:id', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `UPDATE employer_vendor_links SET status = 'revoked', revoked_at = NOW()
     WHERE id = $1 AND (buyer_employer_id = $2 OR vendor_employer_id = $2) AND status = 'approved'
     RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Link not found or not active' });

  const link = result.rows[0];
  const otherId = link.buyer_employer_id === req.user.id ? link.vendor_employer_id : link.buyer_employer_id;
  const me = await db.query(`SELECT name, email FROM users WHERE id = $1`, [req.user.id]);
  const other = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [otherId]);
  sendVendorLinkRevoked(other.rows[0], me.rows[0]).catch(err => console.error('[vendor link email]', err.message));

  res.json({ success: true });
});

// POST /api/employer/vendors/:id/approve — buyer approves a pending request
router.post('/vendors/:id/approve', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `UPDATE employer_vendor_links SET status = 'approved', approved_at = NOW()
     WHERE id = $1 AND buyer_employer_id = $2 AND status = 'pending' RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Request not found or already actioned' });

  const buyer = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [req.user.id]);
  const vendor = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [result.rows[0].vendor_employer_id]);
  sendVendorLinkApproved(buyer.rows[0], vendor.rows[0]).catch(err => console.error('[vendor link email]', err.message));

  res.json(result.rows[0]);
});

// POST /api/employer/vendors/:id/decline — buyer declines a pending request
router.post('/vendors/:id/decline', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `UPDATE employer_vendor_links SET status = 'declined'
     WHERE id = $1 AND buyer_employer_id = $2 AND status = 'pending' RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Request not found or already actioned' });

  const buyer = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [req.user.id]);
  const vendor = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [result.rows[0].vendor_employer_id]);
  sendVendorLinkDeclined(buyer.rows[0], vendor.rows[0]).catch(err => console.error('[vendor link email]', err.message));

  res.json({ success: true });
});

// ── Vendor jobs — what an approved vendor can see and submit to ────────────

// GET /api/employer/vendors/jobs — active jobs from buyers where I'm an approved vendor
router.get('/vendors/jobs', auth, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const result = await db.query(
    `SELECT j.id, j.title, j.description, j.location, j.work_requirement, j.is_public, j.created_at,
            u.company, u.id AS buyer_employer_id,
            EXISTS (
              SELECT 1 FROM vendor_submissions vs WHERE vs.job_id = j.id AND vs.vendor_employer_id = $1
            ) AS already_submitted
     FROM jobs j
     JOIN users u ON u.id = j.employer_id
     JOIN employer_vendor_links l ON l.buyer_employer_id = j.employer_id AND l.vendor_employer_id = $1 AND l.status = 'approved'
     WHERE j.status = 'active' AND (j.expires_at IS NULL OR j.expires_at > NOW())
     ORDER BY j.created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/employer/vendors/jobs/:jobId/submissions — submit a candidate to a job I'm approved to supply
router.post('/vendors/jobs/:jobId/submissions', auth, (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Forbidden' });
  const { candidateName, candidateEmail, candidatePhone, coverNote, resumeText } = req.body;
  if (!candidateName || !candidateEmail) return res.status(400).json({ error: 'Candidate name and email are required' });

  const jobResult = await db.query(
    `SELECT j.id, j.title, j.employer_id, u.name AS buyer_name, u.email AS buyer_email, u.company
     FROM jobs j
     JOIN users u ON u.id = j.employer_id
     JOIN employer_vendor_links l ON l.buyer_employer_id = j.employer_id AND l.vendor_employer_id = $1 AND l.status = 'approved'
     WHERE j.id = $2 AND j.status = 'active'`,
    [req.user.id, req.params.jobId]
  );
  if (!jobResult.rows.length) return res.status(404).json({ error: 'Not found, or you are not an approved vendor for this job' });
  const job = jobResult.rows[0];

  let parsedResumeText = resumeText?.trim() || null;
  if (req.file) {
    try {
      parsedResumeText = await parseResumeFile(req.file.buffer, req.file.originalname);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  try {
    const result = await db.query(
      `INSERT INTO vendor_submissions (job_id, vendor_employer_id, candidate_name, candidate_email, candidate_phone, resume_text, cover_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [job.id, req.user.id, candidateName, candidateEmail, candidatePhone || null, parsedResumeText, coverNote || null]
    );

    const vendor = await db.query(`SELECT name, email, company FROM users WHERE id = $1`, [req.user.id]);
    await sendVendorSubmissionNotification(
      { name: job.buyer_name, email: job.buyer_email },
      vendor.rows[0],
      job,
      candidateName
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'You have already submitted this candidate for this job' });
    throw err;
  }
});

module.exports = router;
