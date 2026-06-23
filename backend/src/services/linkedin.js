const { generateText } = require('ai');
const { createGroq } = require('@ai-sdk/groq');
const db = require('../db');

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const LLM_MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';

// Analyzes a candidate's own self-reported professional summary (no LinkedIn
// scraping — Proxycurl shut down in 2026 after LinkedIn's lawsuit over
// unauthorized scraping, and similar third-party scraping APIs carry the
// same legal exposure).
async function analyzeProfileSummary(summaryText) {
  const prompt = `You are an expert HR analyst. A candidate has written the following professional summary about themselves, in their own words. Turn it into a structured profile in JSON format.

CANDIDATE'S SELF-REPORTED SUMMARY:
${summaryText.slice(0, 3000)}

Return ONLY valid JSON with this exact structure:
{
  "profileScore": integer 0-100,
  "summary": "2-3 sentence professional narrative, written in third person",
  "currentTitle": "current job title or null",
  "currentCompany": "current company name or null",
  "experienceYears": integer estimated total years of experience,
  "topSkills": ["skill1", "skill2", "skill3", "skill4"],
  "educationHighlights": ["Degree at School"],
  "careerTrajectory": "1-2 sentences describing career progression pattern",
  "profileStrength": "Beginner" or "Intermediate" or "Advanced" or "Expert"
}

profileScore guidelines (this reflects clarity and depth of what the candidate shared, NOT a verified network metric):
- 80-100: Detailed, well-articulated summary with clear roles, skills, and progression
- 60-79: Solid summary with reasonable detail
- 40-59: Brief or sparse summary
- 0-39: Minimal information provided

If the summary is too sparse to infer a field confidently, use null or an empty array rather than guessing.`;

  const { text } = await generateText({ model: groq(LLM_MODEL), prompt });
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

async function generateProfileAnalysis(referralRequestId) {
  const result = await db.query(
    `SELECT candidate_professional_summary FROM referral_requests WHERE id = $1`,
    [referralRequestId]
  );

  const { candidate_professional_summary } = result.rows[0] || {};
  if (!candidate_professional_summary?.trim()) return null;

  const analysis = await analyzeProfileSummary(candidate_professional_summary);

  await db.query(
    `UPDATE referral_requests SET linkedin_analysis_json = $1 WHERE id = $2`,
    [JSON.stringify(analysis), referralRequestId]
  );

  return analysis;
}

module.exports = { generateProfileAnalysis };
