const express = require('express');
const multer = require('multer');
const db = require('../db');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { sendNewApplicantNotification } = require('../services/email');
const { parseResumeFile } = require('../services/resumeParser');

const router = express.Router();

const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];
const upload = multer({
  storage: multer.memoryStorage(), // buffer only — never written to disk; discarded after parsing
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_RESUME_EXTENSIONS.includes(ext)) {
      return cb(new Error('Only .pdf, .doc, and .docx resumes are accepted'));
    }
    cb(null, true);
  },
});

const PAGE_SIZE = 20;

// GET /api/jobs?page=1 — fully public, no login required. Browsable across all
// employers' public postings. Company name is shown (standard for job listings);
// the employer's personal name/email/phone never appear here. Applying (below)
// still requires a logged-in jobseeker account.
router.get('/', optionalAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const result = await db.query(
    `SELECT j.id, j.title, j.description, j.location, j.work_requirement, j.created_at,
       u.company,
       EXISTS (
         SELECT 1 FROM job_applications ja WHERE ja.job_id = j.id AND ja.jobseeker_id = $1
       ) AS already_applied,
       COUNT(*) OVER() AS total_count
     FROM jobs j
     JOIN users u ON u.id = j.employer_id
     WHERE j.is_public = true AND j.status = 'active'
       AND (j.expires_at IS NULL OR j.expires_at > NOW())
     ORDER BY j.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user?.id || null, PAGE_SIZE, offset]
  );

  const totalCount = result.rows[0]?.total_count ? parseInt(result.rows[0].total_count) : 0;
  const jobs = result.rows.map(({ total_count, ...rest }) => rest);

  res.json({
    jobs,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  });
});

// GET /api/jobs/flash — public, no login. The 5 most recently activated Flash Jobs,
// for the home page. If more than 5 are active at once, the oldest simply stops
// appearing here (no state mutation) — its flash_expires_at is unaffected.
router.get('/flash', optionalAuth, async (req, res) => {
  const result = await db.query(
    `SELECT j.id, j.title, j.description, j.location, j.work_requirement, j.created_at,
       u.company,
       EXISTS (
         SELECT 1 FROM job_applications ja WHERE ja.job_id = j.id AND ja.jobseeker_id = $1
       ) AS already_applied
     FROM jobs j
     JOIN users u ON u.id = j.employer_id
     WHERE j.flash_status = 'active' AND j.status = 'active'
       AND j.flash_expires_at > NOW()
       AND (j.expires_at IS NULL OR j.expires_at > NOW())
     ORDER BY j.flash_activated_at DESC
     LIMIT 5`,
    [req.user?.id || null]
  );
  res.json(result.rows);
});

// POST /api/jobs/:id/apply — jobseeker only. A deliberate disclosure: the employer
// sees the applicant's real name/email/resume, same as any normal job application.
// Accepts an optional resume as an uploaded .pdf/.doc/.docx file (parsed to text and
// discarded — the file itself is never stored) OR pasted resume text directly.
router.post('/:id/apply', auth, (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  if (req.user.role !== 'jobseeker') return res.status(403).json({ error: 'Only job seekers can apply' });
  const { message, resumeText } = req.body;

  const jobResult = await db.query(
    `SELECT j.id, j.title, j.employer_id, u.name AS employer_name, u.email AS employer_email
     FROM jobs j JOIN users u ON u.id = j.employer_id
     WHERE j.id = $1 AND j.is_public = true AND j.status = 'active'
       AND (j.expires_at IS NULL OR j.expires_at > NOW())`,
    [req.params.id]
  );
  if (!jobResult.rows.length) return res.status(404).json({ error: 'Not found' });
  const job = jobResult.rows[0];

  const applicantResult = await db.query(`SELECT name, email, resume_url FROM users WHERE id = $1`, [req.user.id]);
  const applicant = applicantResult.rows[0];

  let parsedResumeText = resumeText?.trim() || null;
  if (req.file) {
    try {
      parsedResumeText = await parseResumeFile(req.file.buffer, req.file.originalname);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  try {
    await db.query(
      `INSERT INTO job_applications (job_id, jobseeker_id, applicant_name, applicant_email, resume_url, resume_text, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [job.id, req.user.id, applicant.name, applicant.email, applicant.resume_url || null, parsedResumeText, message || null]
    );
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'You have already applied to this job' });
    throw err;
  }

  await sendNewApplicantNotification(
    { name: job.employer_name, email: job.employer_email },
    applicant,
    job,
    message
  );
  res.json({ success: true });
});

module.exports = router;
