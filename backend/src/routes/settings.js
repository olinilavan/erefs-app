const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/settings
router.get('/', auth, async (req, res) => {
  const result = await db.query(
    `SELECT id, email, name, role, company, headline, linkedin_url, professional_summary, resume_url,
            share_link_expiry_days, publicly_discoverable, allow_employer_contact,
            years_experience, location, availability, vm_id,
            require_work_email, reminder_days, wants_custom_questions, default_job_is_public,
            bench_report_enabled,
            subscription_plan, subscription_started_at, terms_accepted_at, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// PUT /api/settings
router.put('/', auth, async (req, res) => {
  const { name, company, headline, linkedin_url, professional_summary, resume_url, share_link_expiry_days,
          publicly_discoverable, allow_employer_contact, years_experience, location, availability,
          require_work_email, reminder_days, wants_custom_questions, default_job_is_public,
          bench_report_enabled } = req.body;
  const result = await db.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         company = COALESCE($2, company),
         headline = COALESCE($3, headline),
         linkedin_url = COALESCE($4, linkedin_url),
         professional_summary = COALESCE($5, professional_summary),
         resume_url = COALESCE($6, resume_url),
         share_link_expiry_days = COALESCE($7, share_link_expiry_days),
         publicly_discoverable = COALESCE($8, publicly_discoverable),
         allow_employer_contact = COALESCE($9, allow_employer_contact),
         years_experience = COALESCE($10, years_experience),
         location = COALESCE($11, location),
         availability = COALESCE($12, availability),
         require_work_email = COALESCE($13, require_work_email),
         reminder_days = COALESCE($14, reminder_days),
         wants_custom_questions = COALESCE($15, wants_custom_questions),
         default_job_is_public = COALESCE($16, default_job_is_public),
         bench_report_enabled = COALESCE($17, bench_report_enabled)
     WHERE id = $18
     RETURNING id, email, name, role, company, headline, linkedin_url, professional_summary, resume_url,
               share_link_expiry_days, publicly_discoverable, allow_employer_contact,
               years_experience, location, availability, vm_id,
               require_work_email, reminder_days, wants_custom_questions, default_job_is_public,
               bench_report_enabled,
               subscription_plan, subscription_started_at, terms_accepted_at`,
    [name, company, headline, linkedin_url, professional_summary, resume_url, share_link_expiry_days,
     publicly_discoverable, allow_employer_contact, years_experience, location, availability,
     require_work_email, reminder_days, wants_custom_questions, default_job_is_public,
     bench_report_enabled ?? null, req.user.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
