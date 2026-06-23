const express = require('express');
const db = require('../db');

const router = express.Router();

const PAGE_SIZE = 20;

// GET /api/talent?page=1 — public, anonymized, paginated directory (no auth). Read-only:
// contacting a candidate requires a logged-in employer account, handled under /api/employer.
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const result = await db.query(
    `SELECT u.vm_id, u.headline, u.years_experience, u.location, u.availability,
       EXISTS (
         SELECT 1 FROM reports rep
         JOIN referrers rf ON rf.id = rep.referrer_id
         JOIN referral_requests rr ON rr.id = rf.referral_request_id
         WHERE rr.requester_id = u.id
       ) AS reference_complete,
       COUNT(*) OVER() AS total_count
     FROM users u
     WHERE u.role = 'jobseeker' AND u.publicly_discoverable = true AND u.allow_employer_contact = true
       AND u.headline IS NOT NULL AND u.headline != ''
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    [PAGE_SIZE, offset]
  );

  const totalCount = result.rows[0]?.total_count ? parseInt(result.rows[0].total_count) : 0;
  const candidates = result.rows.map(({ total_count, ...rest }) => rest);

  res.json({
    candidates,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    totalCount,
  });
});

module.exports = router;
