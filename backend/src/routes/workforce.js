const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendBenchReport } = require('../services/email');

const router = express.Router();

function requireEmployer(req, res, next) {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Employer only' });
  next();
}

function computedStatus(resource, activePlacement) {
  if (resource.status === 'on_leave' || resource.status === 'inactive') return resource.status;
  if (!activePlacement) return 'bench';
  if (!activePlacement.end_date) return 'placed';
  const days = Math.ceil((new Date(activePlacement.end_date) - new Date()) / 86400000);
  if (days < 0)  return 'bench';
  if (days <= 30) return 'ending_soon';
  return 'placed';
}

const WITH_PLACEMENT = `
  SELECT r.*,
    p.id          AS placement_id,
    p.client_name, p.project_name,
    p.start_date  AS placement_start,
    p.end_date    AS placement_end,
    p.bill_rate, p.pay_rate, p.rate_type,
    p.notes       AS placement_notes
  FROM workforce_resources r
  LEFT JOIN workforce_placements p ON p.resource_id = r.id AND p.status = 'active'
`;

function enrichRow(r) {
  const placement = r.placement_id
    ? { id: r.placement_id, clientName: r.client_name, projectName: r.project_name,
        startDate: r.placement_start, endDate: r.placement_end,
        billRate: r.bill_rate, payRate: r.pay_rate, rateType: r.rate_type,
        notes: r.placement_notes }
    : null;
  const { placement_id, client_name, project_name, placement_start, placement_end,
          bill_rate, pay_rate, rate_type, placement_notes, ...resource } = r;
  return { ...resource, computed_status: computedStatus(resource, placement), placement };
}

// ── Bench report (must be before /:id) ───────────────────────────────────────

router.get('/bench', auth, requireEmployer, async (req, res) => {
  const days = Math.max(1, Math.min(365, parseInt(req.query.days) || 30));
  const result = await db.query(`
    ${WITH_PLACEMENT}
    WHERE r.employer_id = $1
      AND r.status NOT IN ('inactive')
      AND (
        p.id IS NULL
        OR p.end_date < CURRENT_DATE
        OR p.end_date <= CURRENT_DATE + ($2::int * INTERVAL '1 day')
      )
    ORDER BY p.end_date ASC NULLS FIRST, r.name ASC
  `, [req.user.id, days]);
  res.json(result.rows.map(enrichRow));
});

router.post('/bench/email', auth, requireEmployer, async (req, res) => {
  const days = Math.max(1, Math.min(365, parseInt(req.body.days) || 30));
  const [benchResult, empResult] = await Promise.all([
    db.query(`
      ${WITH_PLACEMENT}
      WHERE r.employer_id = $1
        AND r.status NOT IN ('inactive')
        AND (
          p.id IS NULL
          OR p.end_date < CURRENT_DATE
          OR p.end_date <= CURRENT_DATE + ($2::int * INTERVAL '1 day')
        )
      ORDER BY p.end_date ASC NULLS FIRST, r.name ASC
    `, [req.user.id, days]),
    db.query('SELECT name, email, company FROM users WHERE id = $1', [req.user.id]),
  ]);
  await sendBenchReport(empResult.rows[0], benchResult.rows.map(enrichRow), days);
  res.json({ ok: true });
});

// ── Resource CRUD ─────────────────────────────────────────────────────────────

router.get('/', auth, requireEmployer, async (req, res) => {
  const result = await db.query(
    `${WITH_PLACEMENT} WHERE r.employer_id = $1 ORDER BY r.name ASC`,
    [req.user.id]
  );
  res.json(result.rows.map(enrichRow));
});

router.post('/', auth, requireEmployer, async (req, res) => {
  const { name, email, phone, jobTitle, skills, location, employmentType, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const result = await db.query(`
    INSERT INTO workforce_resources
      (employer_id, name, email, phone, job_title, skills, location, employment_type, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.id, name, email || null, phone || null, jobTitle || null,
     skills || null, location || null, employmentType || 'employee', notes || null]);
  res.status(201).json({ ...result.rows[0], computed_status: 'bench', placement: null });
});

router.get('/:id', auth, requireEmployer, async (req, res) => {
  const [resourceResult, placementsResult] = await Promise.all([
    db.query(`${WITH_PLACEMENT} WHERE r.id = $1 AND r.employer_id = $2`, [req.params.id, req.user.id]),
    db.query('SELECT * FROM workforce_placements WHERE resource_id = $1 ORDER BY start_date DESC', [req.params.id]),
  ]);
  if (!resourceResult.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ resource: enrichRow(resourceResult.rows[0]), placements: placementsResult.rows });
});

router.put('/:id', auth, requireEmployer, async (req, res) => {
  const { name, email, phone, jobTitle, skills, location, employmentType, status, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const result = await db.query(`
    UPDATE workforce_resources SET
      name=$1, email=$2, phone=$3, job_title=$4, skills=$5,
      location=$6, employment_type=$7, status=$8, notes=$9, updated_at=NOW()
    WHERE id=$10 AND employer_id=$11 RETURNING *`,
    [name, email || null, phone || null, jobTitle || null, skills || null,
     location || null, employmentType || 'employee', status || 'bench',
     notes || null, req.params.id, req.user.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });

  // Re-fetch with placement to return enriched row
  const full = await db.query(
    `${WITH_PLACEMENT} WHERE r.id = $1`, [req.params.id]);
  res.json(enrichRow(full.rows[0]));
});

router.delete('/:id', auth, requireEmployer, async (req, res) => {
  const result = await db.query(
    'DELETE FROM workforce_resources WHERE id=$1 AND employer_id=$2 RETURNING id',
    [req.params.id, req.user.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// ── Placements ────────────────────────────────────────────────────────────────

router.post('/:id/placements', auth, requireEmployer, async (req, res) => {
  const { clientName, projectName, startDate, endDate, billRate, payRate, rateType, notes } = req.body;
  if (!clientName || !startDate) return res.status(400).json({ error: 'Client name and start date are required' });

  const own = await db.query(
    'SELECT id FROM workforce_resources WHERE id=$1 AND employer_id=$2',
    [req.params.id, req.user.id]);
  if (!own.rows.length) return res.status(404).json({ error: 'Not found' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      "UPDATE workforce_placements SET status='ended' WHERE resource_id=$1 AND status='active'",
      [req.params.id]);
    const placement = await client.query(`
      INSERT INTO workforce_placements
        (resource_id, client_name, project_name, start_date, end_date, bill_rate, pay_rate, rate_type, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.id, clientName, projectName || null, startDate, endDate || null,
       billRate || null, payRate || null, rateType || 'hourly', notes || null]);
    await client.query(
      "UPDATE workforce_resources SET status='placed', updated_at=NOW() WHERE id=$1",
      [req.params.id]);
    await client.query('COMMIT');
    res.status(201).json(placement.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.patch('/:id/placements/:pid', auth, requireEmployer, async (req, res) => {
  const own = await db.query(
    'SELECT id FROM workforce_resources WHERE id=$1 AND employer_id=$2',
    [req.params.id, req.user.id]);
  if (!own.rows.length) return res.status(404).json({ error: 'Not found' });

  const fields = [];
  const vals   = [];
  let i = 1;
  if (req.body.endDate   !== undefined) { fields.push(`end_date=$${i++}`);    vals.push(req.body.endDate); }
  if (req.body.status    !== undefined) { fields.push(`status=$${i++}`);      vals.push(req.body.status); }
  if (req.body.notes     !== undefined) { fields.push(`notes=$${i++}`);       vals.push(req.body.notes); }
  if (req.body.billRate  !== undefined) { fields.push(`bill_rate=$${i++}`);   vals.push(req.body.billRate); }
  if (req.body.payRate   !== undefined) { fields.push(`pay_rate=$${i++}`);    vals.push(req.body.payRate); }
  if (req.body.clientName!== undefined) { fields.push(`client_name=$${i++}`); vals.push(req.body.clientName); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(req.params.pid, req.params.id);
  const result = await db.query(
    `UPDATE workforce_placements SET ${fields.join(', ')} WHERE id=$${i++} AND resource_id=$${i} RETURNING *`,
    vals);
  if (!result.rows.length) return res.status(404).json({ error: 'Placement not found' });

  if (req.body.status === 'ended') {
    await db.query(
      "UPDATE workforce_resources SET status='bench', updated_at=NOW() WHERE id=$1",
      [req.params.id]);
  }
  res.json(result.rows[0]);
});

module.exports = router;
