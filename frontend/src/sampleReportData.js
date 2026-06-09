const SAMPLE_REPORT = {
  referrer_name: 'Sarah Mitchell',
  target_role: 'Senior Software Engineer',
  candidate_name: 'Alex Chen',
  created_at: new Date().toISOString(),
  share_token: null,
  llm_output_json: {
    executiveSummary:
      'Alex consistently demonstrates exceptional technical leadership and a collaborative spirit that elevates everyone around them. Across all feedback, themes of proactive ownership, clear communication, and mentorship of junior developers stood out strongly. Referees unanimously described Alex as someone who thrives under pressure and delivers with quality.',
    scores: {
      overallPerformance: 4.7,
      teamwork: 4.8,
      communication: 4.5,
      problemSolving: 4.9,
      leadership: 4.4,
    },
    keyStrengths: [
      'Exceptional problem-solving under pressure — consistently delivers in ambiguous situations',
      'Natural mentor who actively invests in junior team members',
      'Clear, concise communicator across both technical and non-technical audiences',
    ],
    areasForDevelopment: [
      'Tends to take on too much independently — still developing delegation habits',
      'Would benefit from broader exposure to cross-functional stakeholder management',
    ],
    cultureFit:
      'Thrives in fast-paced, high-ownership engineering cultures with strong peer collaboration. Best suited to environments that value quality and innovation over rigid process.',
    rehireSignal: {
      yes: 3,
      no: 0,
      context: 'All three referees expressed they would rehire or work with Alex again without hesitation.',
    },
    notableQuotes: [
      'Alex is the kind of engineer you build a team around — technically brilliant and genuinely collaborative.',
      "I've worked with many developers over 15 years. Alex stands out for their ability to own problems end to end.",
    ],
    confidenceScore: 94,
    confidenceNote: 'High confidence based on 3 detailed responses with strongly consistent themes across all referees.',
  },
};

export default SAMPLE_REPORT;
