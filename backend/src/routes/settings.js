const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/settings
router.get('/', auth, async (req, res) => {
  const result = await db.query(
    `SELECT id, email, name, role, company, headline,
            require_work_email, reminder_days, wants_custom_questions,
            subscription_plan, subscription_started_at, terms_accepted_at, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// PUT /api/settings
router.put('/', auth, async (req, res) => {
  const { name, company, headline, require_work_email, reminder_days, wants_custom_questions } = req.body;
  const result = await db.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         company = COALESCE($2, company),
         headline = COALESCE($3, headline),
         require_work_email = COALESCE($4, require_work_email),
         reminder_days = COALESCE($5, reminder_days),
         wants_custom_questions = COALESCE($6, wants_custom_questions)
     WHERE id = $7
     RETURNING id, email, name, role, company, headline,
               require_work_email, reminder_days, wants_custom_questions,
               subscription_plan, subscription_started_at, terms_accepted_at`,
    [name, company, headline, require_work_email, reminder_days, wants_custom_questions, req.user.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
