const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendPasswordReset } = require('../services/email');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role, company, headline, termsAccepted } = req.body;
  if (!termsAccepted) return res.status(400).json({ error: 'You must accept the Terms & Conditions' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, company, headline, terms_accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, email, name, role, company, is_admin`,
      [email, hash, name, role, company || null, headline || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, is_admin: user.is_admin || false }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company || null, is_admin: user.is_admin || false } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, is_admin: user.is_admin || false }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company || null, is_admin: user.is_admin || false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const userId = result.rows[0].id;
      await db.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL',
        [userId]
      );
      const tokenResult = await db.query(
        'INSERT INTO password_reset_tokens (user_id) VALUES ($1) RETURNING token',
        [userId]
      );
      await sendPasswordReset(email, tokenResult.rows[0].token);
    }
    res.json({ message: 'If an account with that email exists, you will receive a reset link shortly.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !UUID_RE.test(token)) return res.status(400).json({ error: 'Invalid reset link' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const result = await db.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [token]
    );
    if (!result.rows.length) return res.status(400).json({ error: 'Reset link is invalid or has expired' });

    const reset = result.rows[0];
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, reset.user_id]);
    await db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [reset.id]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
