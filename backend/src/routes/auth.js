const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const { sendPasswordReset, sendVerificationEmail } = require('../services/email');

// ── LinkedIn OAuth helpers ──────────────────────────────────────────────────
// Uses "Sign In with LinkedIn using OpenID Connect" — the only publicly
// available LinkedIn auth tier.  Work history / skills require LinkedIn's
// restricted Partner Programme and are NOT available here.
const LI_AUTH_URL   = 'https://www.linkedin.com/oauth/v2/authorization';
const LI_TOKEN_URL  = 'https://www.linkedin.com/oauth/v2/accessToken';
const LI_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const LI_SCOPES     = 'openid profile email';   // gives: sub, name, email, picture

function linkedInRedirectUri() {
  // Must match exactly what is registered in your LinkedIn app
  const base = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`);
  return `${base}/api/auth/linkedin/callback`;
}

/** Exchange authorisation code for access token + fetch userinfo */
async function fetchLinkedInUser(code) {
  const params = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    redirect_uri:  linkedInRedirectUri(),
    client_id:     process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
  });

  // 1. Get access token
  const tokenRes = await fetch(LI_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(tokenData.error_description || 'LinkedIn token exchange failed');

  // 2. Fetch userinfo (OpenID Connect standard endpoint)
  const userRes = await fetch(LI_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userInfo = await userRes.json();
  // userInfo shape: { sub, name, given_name, family_name, picture, email, locale }
  return userInfo;
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, role, company, headline, termsAccepted } = req.body;
  if (!termsAccepted) return res.status(400).json({ error: 'You must accept the Terms & Conditions' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    // If email exists and is verified → reject
    // If email exists and is unverified → delete old account (attacker squatting) and re-register
    const existing = await db.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      if (existing.rows[0].is_verified) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      await db.query('DELETE FROM users WHERE id = $1', [existing.rows[0].id]);
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, company, headline, terms_accepted_at, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), false) RETURNING id, email, name, role, company, is_admin`,
      [email, hash, name, role, company || null, headline || null]
    );
    const user = result.rows[0];

    const tokenResult = await db.query(
      'INSERT INTO email_verification_tokens (user_id) VALUES ($1) RETURNING token',
      [user.id]
    );
    await sendVerificationEmail(email, tokenResult.rows[0].token);

    res.json({ message: 'Account created. Please check your email to verify your account.' });
  } catch (err) {
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
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.', code: 'EMAIL_NOT_VERIFIED' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, is_admin: user.is_admin || false }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company || null, is_admin: user.is_admin || false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;
  if (!UUID_RE.test(token)) return res.status(400).json({ error: 'Invalid verification link' });
  try {
    const result = await db.query(
      `SELECT * FROM email_verification_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    if (!result.rows.length) return res.status(400).json({ error: 'Verification link is invalid or has expired' });

    await db.query('UPDATE users SET is_verified = true WHERE id = $1', [result.rows[0].user_id]);
    await db.query('DELETE FROM email_verification_tokens WHERE id = $1', [result.rows[0].id]);

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await db.query(
      'SELECT id, is_verified FROM users WHERE email = $1', [email]
    );
    if (result.rows.length > 0 && !result.rows[0].is_verified) {
      const userId = result.rows[0].id;
      await db.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
      const tokenResult = await db.query(
        'INSERT INTO email_verification_tokens (user_id) VALUES ($1) RETURNING token', [userId]
      );
      await sendVerificationEmail(email, tokenResult.rows[0].token);
    }
    res.json({ message: 'If your account is pending verification, a new email has been sent.' });
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

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential, role, company, headline, termsAccepted } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing Google credential' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    const existing = await db.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      if (user.is_active === false) {
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
      }
      // Link google_id if the user previously registered with email/password
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = $1, is_verified = true WHERE id = $2', [googleId, user.id]);
      }
      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name, is_admin: user.is_admin || false },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company || null, is_admin: user.is_admin || false } });
    }

    // New Google user — need role before we can create the account
    if (!role) return res.status(200).json({ needsRole: true });
    if (!termsAccepted) return res.status(400).json({ error: 'You must accept the Terms & Conditions' });

    const result = await db.query(
      `INSERT INTO users (email, name, role, company, headline, google_id, is_verified, terms_accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING id, email, name, role, company, is_admin`,
      [email, name, role, company || null, headline || null, googleId]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, is_admin: user.is_admin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company || null, is_admin: user.is_admin || false } });
  } catch (err) {
    console.error('[google auth]', err.message);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// GET /api/auth/linkedin — redirect browser to LinkedIn consent screen
router.get('/linkedin', (req, res) => {
  if (!process.env.LINKEDIN_CLIENT_ID) {
    return res.status(503).send('LinkedIn sign-in is not configured on this server.');
  }
  const state = Math.random().toString(36).slice(2);   // CSRF nonce (stateless; validated client-side)
  const url = new URL(LI_AUTH_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id',     process.env.LINKEDIN_CLIENT_ID);
  url.searchParams.set('redirect_uri',  linkedInRedirectUri());
  url.searchParams.set('scope',         LI_SCOPES);
  url.searchParams.set('state',         state);
  res.redirect(url.toString());
});

// GET /api/auth/linkedin/callback — LinkedIn redirects here after consent
router.get('/linkedin/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  const frontendBase = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';

  if (error || !code) {
    return res.redirect(`${frontendBase}/login?error=${encodeURIComponent(error_description || 'LinkedIn sign-in was cancelled')}`);
  }

  try {
    const li = await fetchLinkedInUser(code);
    // li = { sub, name, email, picture, locale, ... }

    if (!li.sub || !li.email) {
      return res.redirect(`${frontendBase}/login?error=${encodeURIComponent('Could not retrieve your LinkedIn profile')}`);
    }

    // Find existing user by linkedin_id OR email
    const existing = await db.query(
      'SELECT * FROM users WHERE linkedin_id = $1 OR email = $2',
      [li.sub, li.email]
    );

    let user;

    if (existing.rows.length > 0) {
      user = existing.rows[0];
      if (user.is_active === false) {
        return res.redirect(`${frontendBase}/login?error=${encodeURIComponent('Your account has been deactivated. Please contact support.')}`);
      }
      // Link linkedin_id + update photo if not already set
      await db.query(
        `UPDATE users
            SET linkedin_id       = COALESCE(linkedin_id, $1),
                profile_photo_url = COALESCE(profile_photo_url, $2),
                is_verified       = true
          WHERE id = $3`,
        [li.sub, li.picture || null, user.id]
      );
    } else {
      // New LinkedIn user — send to role-select page; pass profile in a short-lived way via query params
      const payload = Buffer.from(JSON.stringify({ sub: li.sub, email: li.email, name: li.name, picture: li.picture || null })).toString('base64url');
      return res.redirect(`${frontendBase}/auth/linkedin/role?profile=${payload}`);
    }

    // Issue JWT
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role, name: user.name, is_admin: user.is_admin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const userJson = encodeURIComponent(JSON.stringify({
      id: user.id, email: user.email, name: user.name,
      role: user.role, company: user.company || null,
      is_admin: user.is_admin || false,
      profile_photo_url: li.picture || user.profile_photo_url || null,
    }));
    res.redirect(`${frontendBase}/auth/linkedin/success?token=${jwtToken}&user=${userJson}`);

  } catch (err) {
    console.error('[linkedin callback]', err.message);
    res.redirect(`${frontendBase}/login?error=${encodeURIComponent('LinkedIn sign-in failed. Please try again.')}`);
  }
});

// POST /api/auth/linkedin/complete — called from role-select page to create account
router.post('/linkedin/complete', async (req, res) => {
  const { profile, role, company, headline, termsAccepted } = req.body;
  if (!termsAccepted) return res.status(400).json({ error: 'You must accept the Terms & Conditions' });
  if (!profile)       return res.status(400).json({ error: 'Missing LinkedIn profile data' });

  try {
    const li = JSON.parse(Buffer.from(profile, 'base64url').toString('utf8'));
    if (!li.sub || !li.email) return res.status(400).json({ error: 'Invalid profile data' });

    // Guard: race condition where user was created between role-select page load and submit
    const existing = await db.query('SELECT * FROM users WHERE linkedin_id = $1 OR email = $2', [li.sub, li.email]);
    if (existing.rows.length > 0) {
      const u = existing.rows[0];
      await db.query(
        `UPDATE users SET linkedin_id = COALESCE(linkedin_id, $1), profile_photo_url = COALESCE(profile_photo_url, $2), is_verified = true WHERE id = $3`,
        [li.sub, li.picture || null, u.id]
      );
      const token = jwt.sign({ id: u.id, role: u.role, name: u.name, is_admin: u.is_admin || false }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: u.id, email: u.email, name: u.name, role: u.role, company: u.company || null, is_admin: u.is_admin || false, profile_photo_url: li.picture || null } });
    }

    const result = await db.query(
      `INSERT INTO users (email, name, role, company, headline, linkedin_id, profile_photo_url, is_verified, terms_accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       RETURNING id, email, name, role, company, is_admin`,
      [li.email, li.name, role, company || null, headline || null, li.sub, li.picture || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, is_admin: user.is_admin || false }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user, profile_photo_url: li.picture || null } });
  } catch (err) {
    console.error('[linkedin complete]', err.message);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

module.exports = router;
