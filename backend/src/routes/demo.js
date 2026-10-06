const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendDemoEnquiryConfirmation, sendDemoEnquiryAlert } = require('../services/email');
const log = require('../utils/logger');

const router = express.Router();

function adminOnly(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// POST /api/demo — public, no auth
router.post('/', async (req, res) => {
  const { enquiryType, name, email, company, jobTitle, teamSize, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  const type = ['demo', 'enquiry'].includes(enquiryType) ? enquiryType : 'demo';

  const result = await db.query(
    `INSERT INTO demo_enquiries (enquiry_type, name, email, company, job_title, team_size, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [type, name, email, company || null, jobTitle || null, teamSize || null, message || null]
  );
  const submission = result.rows[0];

  sendDemoEnquiryConfirmation(submission).catch(err => log.error('demo.email_confirmation_failed', { id: submission.id, error: err.message }));
  sendDemoEnquiryAlert(submission).catch(err => log.error('demo.email_alert_failed', { id: submission.id, error: err.message }));

  log.info('demo.submitted', { id: submission.id, type, email, company: company || null });
  res.status(201).json({ ok: true });
});

// GET /api/demo/enquiries — admin only
router.get('/enquiries', auth, adminOnly, async (req, res) => {
  const result = await db.query(
    'SELECT * FROM demo_enquiries ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// PATCH /api/demo/enquiries/:id — update status + admin notes
router.patch('/enquiries/:id', auth, adminOnly, async (req, res) => {
  const { status, adminNotes } = req.body;
  const allowed = ['new', 'contacted', 'converted', 'closed'];
  if (status && !allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const result = await db.query(
    `UPDATE demo_enquiries
     SET status      = COALESCE($1, status),
         admin_notes = COALESCE($2, admin_notes),
         updated_at  = NOW()
     WHERE id = $3 RETURNING *`,
    [status || null, adminNotes ?? null, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

module.exports = router;
