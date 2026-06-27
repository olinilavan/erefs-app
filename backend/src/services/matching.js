const { generateText } = require('ai');
const { createGroq } = require('@ai-sdk/groq');

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const LLM_MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';

// Ranks applicants against a job posting. Advisory only — on-demand, never automatic,
// and the rationale is always returned alongside the score so it's never a silent
// number driving a decision.
async function matchCandidatesToJob(job, applicants) {
  const jobContext = `Title: ${job.title}\nDescription: ${job.description || 'N/A'}\nLocation: ${job.location || 'N/A'}\nWork requirement: ${job.work_requirement || 'N/A'}`;

  const candidatesContext = applicants
    .map((a, i) => {
      const content = a.resume_text || a.message || '(no resume or cover note provided)';
      return `--- Candidate ${i + 1} (id: ${a.id}) ---\n${content.slice(0, 4000)}`;
    })
    .join('\n\n');

  const prompt = `You are an expert technical recruiter. Score how well each candidate fits the job below, based only on the information provided. Be honest about thin signal — if a candidate provided no resume or cover note, say so in the rationale and score conservatively rather than guessing.

JOB POSTING:
${jobContext}

CANDIDATES:
${candidatesContext}

Return ONLY a valid JSON array, one entry per candidate, in this exact shape:
[
  { "id": "candidate id from above", "fitScore": 0-100, "rationale": "1-2 sentences explaining the score", "concerns": ["short concern", "..."] }
]`;

  const { text } = await generateText({ model: groq(LLM_MODEL), prompt });
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { matchCandidatesToJob };
