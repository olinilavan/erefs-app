const express = require('express');
const crypto = require('crypto');
const { generateText } = require('ai');
const { createGroq } = require('@ai-sdk/groq');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const LLM_MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-120b';

const SYSTEM_PROMPT = `You are the VouchMetrics support assistant. VouchMetrics is a hiring platform for employers and job seekers.

WHAT VOUCHMETRICS ACTUALLY OFFERS (only reference these — do not invent others):
- Job postings and applicant management
- Flash Jobs: paid featured placements on the home page
- Reference checks: send referrers a form, get AI-generated reports with scores
- Background checks: education verification and criminal record checks
- Vendor/staffing network: connect buyers and agencies, share candidate submissions
- Workforce management: track placed candidates
- Talent Pool: anonymised directory of opted-in job seekers
- Free to get started; premium features available

REAL PAGES AND LINKS (only reference these exact paths — do not invent others):
- Sign up: vouchmetrics.com/register
- Log in: vouchmetrics.com/login
- Browse jobs: vouchmetrics.com/jobs
- Talent directory: vouchmetrics.com/talent
- Book a demo or send an enquiry: vouchmetrics.com/demo

STRICT RULES:
1. ONLY answer questions about VouchMetrics. If asked anything outside this scope (coding help, general knowledge, news, politics, competitors, personal advice), respond: "I'm only here to help with VouchMetrics questions. Is there something about the platform I can help with?"
2. NEVER invent contact details — no phone numbers, no email addresses, no support URLs that are not listed above. If someone asks how to contact support, direct them to vouchmetrics.com/demo.
3. NEVER invent URLs, blog links, newsletter links, social media handles, or product pages that are not listed above.
4. NEVER fabricate pricing figures, release dates, or feature details you are not certain about. Say: "For accurate details, I'd recommend booking a demo at vouchmetrics.com/demo."
5. NEVER answer questions about news, press, announcements, or recent updates — say: "For the latest updates, please book a demo or reach out via vouchmetrics.com/demo."
6. Never ask for or accept passwords, payment details, or sensitive personal information.
7. Keep responses concise — 2 to 4 sentences unless a short bullet list genuinely helps.
8. Be friendly and professional.

PRIVACY NOTE: Inform users on first open that conversations are stored to help improve VouchMetrics support. Do not reference other users' data.`;

function adminOnly(req, res, next) {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

// POST /api/chat/message — public
router.post('/message', async (req, res) => {
  const { sessionToken, message, pageUrl } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
  if (message.length > 1000) return res.status(400).json({ error: 'Message too long' });

  try {
    // Resolve or create session
    let token = sessionToken;
    let sessionId;

    if (token) {
      const existing = await db.query('SELECT id FROM chat_sessions WHERE session_token = $1', [token]);
      if (existing.rows.length) {
        sessionId = existing.rows[0].id;
        await db.query('UPDATE chat_sessions SET last_active_at = NOW() WHERE id = $1', [sessionId]);
      }
    }

    if (!sessionId) {
      token = crypto.randomBytes(32).toString('hex');
      const created = await db.query(
        'INSERT INTO chat_sessions (session_token, page_url) VALUES ($1, $2) RETURNING id',
        [token, pageUrl || null]
      );
      sessionId = created.rows[0].id;
    }

    // Load recent history for context (last 10 messages)
    const history = await db.query(
      `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [sessionId]
    );
    const messages = history.rows.reverse().map(r => ({ role: r.role, content: r.content }));
    messages.push({ role: 'user', content: message.trim() });

    // Call LLM
    const { text: reply } = await generateText({
      model: groq(LLM_MODEL),
      system: SYSTEM_PROMPT,
      messages,
    });

    // Persist both turns
    await db.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3), ($1, $4, $5)',
      [sessionId, 'user', message.trim(), 'assistant', reply.trim()]
    );

    res.json({ reply: reply.trim(), sessionToken: token });
  } catch (err) {
    console.error('[chat]', err.message);
    res.status(500).json({ error: 'Unable to respond right now. Please try again shortly.' });
  }
});

// GET /api/chat/sessions — admin: list all sessions
router.get('/sessions', auth, adminOnly, async (req, res) => {
  const result = await db.query(
    `SELECT s.id, s.session_token, s.page_url, s.created_at, s.last_active_at,
            COUNT(m.id)::int AS message_count,
            MAX(CASE WHEN m.role = 'user' THEN m.content END) AS last_user_message
     FROM chat_sessions s
     LEFT JOIN chat_messages m ON m.session_id = s.id
     GROUP BY s.id
     ORDER BY s.last_active_at DESC`
  );
  res.json(result.rows);
});

// GET /api/chat/sessions/:id — admin: full conversation
router.get('/sessions/:id', auth, adminOnly, async (req, res) => {
  const session = await db.query('SELECT * FROM chat_sessions WHERE id = $1', [req.params.id]);
  if (!session.rows.length) return res.status(404).json({ error: 'Not found' });
  const messages = await db.query(
    'SELECT role, content, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at',
    [req.params.id]
  );
  res.json({ session: session.rows[0], messages: messages.rows });
});

module.exports = router;
