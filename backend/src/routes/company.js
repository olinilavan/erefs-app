const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function requireEmployer(req, res, next) {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Employer only' });
  next();
}

async function getUserCompany(userId) {
  const { rows } = await db.query(
    'SELECT company_id, is_company_admin FROM users WHERE id = $1',
    [userId]
  );
  return rows[0] || {};
}

// GET /api/company/validate-invite/:token  (public — called before registration)
router.get('/validate-invite/:token', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ci.used_at, ci.expires_at, c.name AS company_name, c.id AS company_id
      FROM company_invites ci
      JOIN companies c ON c.id = ci.company_id
      WHERE ci.token = $1
    `, [req.params.token]);

    if (!rows.length) return res.status(404).json({ error: 'Invite link is invalid.' });
    const inv = rows[0];
    if (inv.used_at)                       return res.status(410).json({ error: 'This invite link has already been used.' });
    if (new Date(inv.expires_at) < new Date()) return res.status(410).json({ error: 'This invite link has expired.' });

    res.json({ companyName: inv.company_name, companyId: inv.company_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/company/team
router.get('/team', auth, requireEmployer, async (req, res) => {
  try {
    const { company_id } = await getUserCompany(req.user.id);
    if (!company_id) return res.json({ company: null, members: [] });

    const [compRes, membersRes] = await Promise.all([
      db.query('SELECT id, name, domain FROM companies WHERE id = $1', [company_id]),
      db.query(
        `SELECT id, name, email, is_company_admin, created_at
         FROM users WHERE company_id = $1 ORDER BY is_company_admin DESC, name ASC`,
        [company_id]
      ),
    ]);

    res.json({ company: compRes.rows[0] || null, members: membersRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/company/invites  (company admin only)
router.get('/invites', auth, requireEmployer, async (req, res) => {
  try {
    const { company_id, is_company_admin } = await getUserCompany(req.user.id);
    if (!company_id)       return res.status(400).json({ error: 'You are not part of a company' });
    if (!is_company_admin) return res.status(403).json({ error: 'Only company admins can view invites' });

    const { rows } = await db.query(`
      SELECT ci.id, ci.token, ci.expires_at, ci.used_at, ci.created_at,
             u.name AS used_by_name
      FROM company_invites ci
      LEFT JOIN users u ON u.id = ci.used_by
      WHERE ci.company_id = $1
      ORDER BY ci.created_at DESC LIMIT 20
    `, [company_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/company/invites  (company admin only — generates a single-use link)
router.post('/invites', auth, requireEmployer, async (req, res) => {
  try {
    const { company_id, is_company_admin } = await getUserCompany(req.user.id);
    if (!company_id)       return res.status(400).json({ error: 'You are not part of a company' });
    if (!is_company_admin) return res.status(403).json({ error: 'Only company admins can generate invite links' });

    const token = crypto.randomBytes(32).toString('hex');
    const { rows } = await db.query(`
      INSERT INTO company_invites (company_id, token, created_by, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
      RETURNING token, expires_at
    `, [company_id, token, req.user.id]);

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0];
    const inviteUrl = `${frontendBase}/register?invite=${token}`;

    res.json({ token: rows[0].token, expiresAt: rows[0].expires_at, inviteUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
