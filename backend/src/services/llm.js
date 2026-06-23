const { generateText } = require('ai');
const { createGroq } = require('@ai-sdk/groq');
const db = require('../db');

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const LLM_MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';

const QUESTIONS = [
  'How long have you known the candidate and in what capacity?',
  'On a scale of 1-5, how would you rate their overall job performance?',
  'What are their top 3 professional strengths?',
  'Describe a situation where they handled a challenging problem or conflict.',
  'On a scale of 1-5, how do you rate their collaboration and teamwork skills?',
  'On a scale of 1-5, how do you rate their communication (written & verbal)?',
  'Would you rehire or work with this person again? If not, why?',
  'What type of role or environment do you think they would thrive in most?',
  'Is there any area where they have shown significant growth or still need to develop?',
  "Any additional comments you'd like to share about this candidate?",
];

async function generateReport(referrerId) {
  const refResult = await db.query(
    `SELECT rf.name AS referrer_name, rs.question_number, rs.answer_text, rs.rating
     FROM responses rs
     JOIN referrers rf ON rf.id = rs.referrer_id
     WHERE rs.referrer_id = $1
     ORDER BY rs.question_number`,
    [referrerId]
  );

  const referrerName = refResult.rows[0]?.referrer_name || 'Referrer';
  let context = `\n\n--- Referrer: ${referrerName} ---\n`;
  for (const a of refResult.rows) {
    context += `Q${a.question_number}: ${QUESTIONS[a.question_number - 1]}\n`;
    if (a.rating) context += `Rating: ${a.rating}/5\n`;
    if (a.answer_text) context += `Answer: ${a.answer_text}\n`;
  }

  const prompt = `You are an expert HR analyst. Based on the following referral responses, generate a comprehensive candidate reference report in JSON format.

REFERRAL RESPONSES:
${context}

Return ONLY valid JSON with this structure:
{
  "executiveSummary": "2-3 sentence narrative",
  "scores": {
    "overallPerformance": 0-5,
    "teamwork": 0-5,
    "communication": 0-5,
    "problemSolving": 0-5,
    "leadership": 0-5
  },
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "areasForDevelopment": ["area1", "area2"],
  "cultureFit": "ideal environment description",
  "rehireSignal": { "yes": 0, "no": 0, "context": "summary" },
  "notableQuotes": ["quote1", "quote2"],
  "confidenceScore": 0-100,
  "confidenceNote": "explanation"
}`;

  const { text } = await generateText({
    model: groq(LLM_MODEL),
    prompt,
  });

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const json = JSON.parse(cleaned);

  const { rows: [requesterRow] } = await db.query(
    `SELECT u.share_link_expiry_days
     FROM referrers rf
     JOIN referral_requests rr ON rr.id = rf.referral_request_id
     JOIN users u ON u.id = rr.requester_id
     WHERE rf.id = $1`,
    [referrerId]
  );
  const expiryDays = requesterRow?.share_link_expiry_days || 14;

  await db.query(
    `INSERT INTO reports (referrer_id, llm_output_json, share_token_expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 day'))
     ON CONFLICT (referrer_id) DO UPDATE
       SET llm_output_json = $2, created_at = NOW(), share_token_expires_at = NOW() + ($3 * INTERVAL '1 day')`,
    [referrerId, JSON.stringify(json), expiryDays]
  );

  return json;
}

module.exports = { generateReport };
