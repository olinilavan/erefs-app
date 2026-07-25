#!/usr/bin/env node
/**
 * Demo seed script — wipes and re-seeds all demo data for VouchMetrics demos.
 *
 * Run from erefs-app/backend/:
 *   node scripts/seed-demo.js
 *
 * Employer login:  demo@techcorp.com / Demo1234!
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const PASSWORD   = 'Demo1234!';
const DEMO_TOKEN = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; // fixed token for Frank Wilson (demo candidate form)

const DEMO_EMAILS = [
  'demo@techcorp.com',
  'staffingpro@vmdemo.com',
  'talentfirst@vmdemo.com',
  'sarah.chen@vmdemo.com',
  'marcus.osei@vmdemo.com',
  'priya.nair@vmdemo.com',
];

// ── Realistic AI report content ───────────────────────────────────────────────

const REPORT_BOB_REF1 = {
  executiveSummary: 'Bob Smith is an exceptional software engineer who consistently delivers high-quality work under tight deadlines. Jennifer Park highlights his ability to mentor junior developers while maintaining his own high output. He is regarded as a reliable team player with strong technical leadership qualities.',
  scores: { overallPerformance: 5, teamwork: 5, communication: 4, problemSolving: 5, leadership: 4 },
  keyStrengths: ['Technical depth across the full stack', 'Proactive problem-solver who anticipates blockers before they escalate', 'Natural mentor who elevates the performance of those around him'],
  areasForDevelopment: ['Could delegate more rather than taking on everything himself', 'Sometimes over-engineers solutions when a simpler approach would suffice'],
  cultureFit: 'Thrives in collaborative, fast-paced environments where technical excellence is valued and there is room for ownership and real impact.',
  rehireSignal: { yes: 1, no: 0, context: 'Jennifer stated she would absolutely rehire Bob and described him as one of the strongest engineers she has managed in her 12-year career.' },
  notableQuotes: ['He took our legacy codebase from a liability to an asset in under six months.', 'Every team he joined became more productive — his influence is hard to overstate.'],
  confidenceScore: 92,
  confidenceNote: 'Highly consistent and detailed responses across all questions with specific examples and measurable outcomes provided.',
};

const REPORT_BOB_REF2 = {
  executiveSummary: 'James Chen describes Bob as a standout engineer who combines deep technical skill with a collaborative spirit that makes him a force multiplier for any team. He points to Bob\'s ability to own complex cross-team initiatives from design through delivery as a key differentiator.',
  scores: { overallPerformance: 4, teamwork: 5, communication: 5, problemSolving: 4, leadership: 4 },
  keyStrengths: ['Excellent written and verbal communication — writes clear specs and RFCs that others actually read', 'Strong cross-functional collaborator who builds trust quickly', 'Reliable ownership — follows through without needing reminders'],
  areasForDevelopment: ['Can be overly cautious about shipping before he considers something perfect', 'Would benefit from more experience managing stakeholder expectations at the executive level'],
  cultureFit: 'Best in a high-trust environment that values craftsmanship and gives engineers room to shape architecture decisions.',
  rehireSignal: { yes: 1, no: 0, context: 'James was unequivocal — he would hire Bob again without hesitation and specifically said he hopes their paths cross professionally again.' },
  notableQuotes: ['The best pull requests I have ever reviewed — clear, well-tested, and with context that made review a pleasure.', 'He made our on-call rotation less stressful just by being in it.'],
  confidenceScore: 88,
  confidenceNote: 'Strong, specific responses throughout. Minor gap in leadership question detail lowers confidence slightly.',
};

const REPORT_ALICE_REF1 = {
  executiveSummary: 'Alice Johnson is a highly capable data scientist with an exceptional ability to translate complex analytical findings into actionable business decisions. Her manager describes her as one of the most impactful hires the team has made, combining technical rigour with outstanding communication skills that are rare at her level.',
  scores: { overallPerformance: 5, teamwork: 4, communication: 5, problemSolving: 5, leadership: 4 },
  keyStrengths: ['Exceptional ability to communicate data insights to non-technical stakeholders', 'Deep expertise in ML pipelines and statistical modelling', 'Drives projects end-to-end with minimal oversight needed'],
  areasForDevelopment: ['Can invest more time in documentation and knowledge transfer to the wider team', 'Early in her career as a people manager — would benefit from mentorship in this area'],
  cultureFit: 'Performs best in data-driven organisations where analytical rigour is valued and there is clear scope to influence product and commercial strategy.',
  rehireSignal: { yes: 1, no: 0, context: 'Would rehire immediately and described Alice as a rare find who operates well above her title and level of experience.' },
  notableQuotes: ['She built a churn prediction model that saved us over $2M in its first year.', 'Alice asks the right questions — the kind that make everyone else in the room think harder.'],
  confidenceScore: 95,
  confidenceNote: 'Highly detailed, consistent responses with specific measurable outcomes cited throughout.',
};

const REPORT_ALICE_REF2 = {
  executiveSummary: 'Michael Torres worked with Alice on multiple cross-functional initiatives and consistently found her to be a sharp analytical partner who brings both rigour and creativity to problem-solving. He highlights her resilience under pressure and her ability to rally stakeholders around data-driven recommendations.',
  scores: { overallPerformance: 5, teamwork: 5, communication: 4, problemSolving: 5, leadership: 3 },
  keyStrengths: ['Sharp analytical intuition — finds signal in noisy datasets quickly', 'Excellent at structuring ambiguous problems into actionable frameworks', 'Trusted collaborator across engineering, product, and commercial teams'],
  areasForDevelopment: ['Leadership presence in large group settings could be stronger', 'Expanding into more strategic executive-level presentations would round out her profile'],
  cultureFit: 'Thrives in collaborative, fast-moving environments where data is treated as a first-class input to decision-making rather than an afterthought.',
  rehireSignal: { yes: 1, no: 0, context: 'Michael stated he would work with Alice again without hesitation and recommended her highly for senior individual contributor and tech lead roles.' },
  notableQuotes: ['She showed us a pattern in our data that changed our entire go-to-market strategy.', 'Alice is the person you want in the room when things get complicated.'],
  confidenceScore: 90,
  confidenceNote: 'Well-rounded responses with clear specific examples. Honestly-noted lower leadership score reflects thoughtful calibration.',
};

const REPORT_SARAH_REF1 = {
  executiveSummary: 'Sarah Chen is a highly capable full-stack engineer who combines strong technical execution with an innate ability to work collaboratively across product, design, and backend teams. Mei Lin, her former engineering manager, describes her as one of the fastest learners she has managed — someone who consistently ships well-tested, readable code while keeping a keen eye on the user experience.',
  scores: { overallPerformance: 5, teamwork: 5, communication: 4, problemSolving: 5, leadership: 4 },
  keyStrengths: ['Full-stack breadth with genuine depth in both React and Node.js', 'Unusually strong product intuition for an engineer — asks the right "why" questions early', 'Highly collaborative — bridges design and engineering with ease'],
  areasForDevelopment: ['Growing into technical leadership — strong potential but early in managing other engineers', 'Could invest more in internal documentation as systems grow in complexity'],
  cultureFit: 'Thrives in product-focused engineering teams where there is room for ownership and cross-functional collaboration. Works best when given autonomy with clear product goals.',
  rehireSignal: { yes: 1, no: 0, context: 'Mei said she would hire Sarah again without hesitation and described her as someone she actively recommends to her network.' },
  notableQuotes: ['She rebuilt our entire onboarding flow in a week — cleaner code, 40% faster load time, and zero bugs in production.', 'Sarah has this rare quality of making hard things look easy without cutting corners.'],
  confidenceScore: 93,
  confidenceNote: 'Highly detailed responses with specific project outcomes and consistent themes throughout.',
};

const REPORT_SARAH_REF2 = {
  executiveSummary: 'David Park worked alongside Sarah for two years on a cross-functional product team and consistently found her to be an outstanding collaborator and a highly dependable engineer. He highlights her ability to navigate ambiguity confidently and deliver polished work on tight deadlines.',
  scores: { overallPerformance: 4, teamwork: 5, communication: 4, problemSolving: 4, leadership: 3 },
  keyStrengths: ['Reliable delivery — consistently hits deadlines without sacrificing quality', 'Strong communicator in cross-team settings — translates technical complexity clearly', 'Proactive about unblocking teammates and sharing context'],
  areasForDevelopment: ['Early-stage in taking technical architecture ownership — a natural next step in her growth', 'Presentation confidence in large group settings is developing'],
  cultureFit: 'Excellent fit for collaborative, cross-functional teams that value both craftsmanship and pragmatic delivery. Pairs well with strong product managers.',
  rehireSignal: { yes: 1, no: 0, context: 'David would work with Sarah again and specifically recommended her for senior IC and tech lead roles.' },
  notableQuotes: ['Every sprint she had code in review that I wished I had written myself.', 'She is the kind of teammate who makes the whole team calmer in a crunch.'],
  confidenceScore: 86,
  confidenceNote: 'Strong, consistent responses. Slightly lower leadership detail reflects honest calibration as a peer rather than manager.',
};

const REPORT_MARCUS_REF1 = {
  executiveSummary: 'Marcus Osei is an exceptional data scientist with rare depth in both statistical modelling and ML engineering. Dr. Amara Nwosu, his research director, describes him as the most impactful hire her team has made in five years — someone who operates equally comfortably in a Jupyter notebook and a production pipeline, and who communicates findings in a way that moves business decisions.',
  scores: { overallPerformance: 5, teamwork: 4, communication: 5, problemSolving: 5, leadership: 4 },
  keyStrengths: ['Exceptional ML intuition — identifies the right approach quickly and validates fast', 'Outstanding data storytelling — turns complex model outputs into executive-ready narratives', 'End-to-end ownership from raw data to deployed model to monitoring'],
  areasForDevelopment: ['Opportunity to grow into people management — shows strong mentorship instincts', 'Expanding into ML platform/infra work would broaden his already strong profile'],
  cultureFit: 'Best in data-first organisations where analytical rigour is valued at the executive level and there is a path from insight to product impact. Needs stakeholders who act on data.',
  rehireSignal: { yes: 1, no: 0, context: 'Dr. Nwosu said Marcus is one of the few people she would actively recruit away from a competitor and called him a generational talent in applied ML.' },
  notableQuotes: ['His churn model is still running in production two years after he left — and still outperforming everything we have built since.', 'Marcus has a gift for making a room of sceptical executives trust the data.'],
  confidenceScore: 96,
  confidenceNote: 'Exceptionally detailed responses with multiple measurable outcomes, specific project names, and strong internal consistency.',
};

// ── Referrer responses (10 questions) ────────────────────────────────────────

function responses(rating) {
  const strong = rating >= 5;
  return [
    { q: 1,  text: `I worked directly with this candidate for over ${strong ? 'three' : 'two'} years as their ${strong ? 'direct manager' : 'peer and close collaborator'}.` },
    { q: 2,  text: strong ? 'Among the top performers I have managed in my career — consistently exceeds expectations.' : 'Consistently solid performer who delivers reliably on commitments.', rating },
    { q: 3,  text: strong ? '(1) Technical depth and end-to-end ownership. (2) Clear and concise communication. (3) An ability to elevate those around them.' : '(1) Strong analytical thinking. (2) Reliable follow-through. (3) Collaborative working style.' },
    { q: 4,  text: strong ? 'When our primary database went down mid-afternoon, they diagnosed the root cause in minutes, led the incident response calmly, and restored service in under 30 minutes while keeping all stakeholders informed.' : 'They navigated a difficult stakeholder conflict by bringing all parties together, clearly articulating the trade-offs, and driving consensus on a pragmatic path forward.' },
    { q: 5,  text: 'Excellent team player — always willing to help others and contributes positively to team culture.', rating: Math.min(5, rating) },
    { q: 6,  text: strong ? 'Outstanding communicator — their written updates are models of clarity and their presentations are well-structured and persuasive.' : 'Clear and professional communicator in both writing and meetings.', rating: Math.min(5, rating) },
    { q: 7,  text: 'Yes, absolutely — without hesitation.' },
    { q: 8,  text: strong ? 'A high-autonomy environment where they can take full ownership of a domain and drive it end-to-end. Fast-paced companies that value both technical excellence and pragmatic delivery.' : 'A structured environment with clear goals and a collaborative team where they can continue to grow into more senior responsibilities.' },
    { q: 9,  text: strong ? 'They have grown enormously in executive communication over the past 18 months — from a pure technical contributor to someone who can hold a room of senior stakeholders and influence strategic decisions.' : 'They have shown strong growth in cross-functional collaboration. A further development area is executive-level communication and stakeholder management at scale.' },
    { q: 10, text: strong ? 'I would be very surprised if this candidate is not hired. They are the kind of person who makes entire teams better. I genuinely hope our paths cross professionally again.' : 'A solid professional who brings consistent value. They would be a strong addition to any team looking for a reliable, motivated contributor.' },
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const hash   = await bcrypt.hash(PASSWORD, 10);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ─ Cleanup ────────────────────────────────────────────────────────────────
    console.log('🧹  Cleaning up existing demo data…');
    await client.query(`
      DELETE FROM vendor_submissions
      WHERE vendor_employer_id IN (SELECT id FROM users WHERE email = ANY($1))`,
      [DEMO_EMAILS]);
    await client.query(`
      DELETE FROM employer_vendor_links
      WHERE buyer_employer_id  IN (SELECT id FROM users WHERE email = ANY($1))
         OR vendor_employer_id IN (SELECT id FROM users WHERE email = ANY($1))`,
      [DEMO_EMAILS]);
    await client.query(`DELETE FROM users WHERE email = ANY($1)`, [DEMO_EMAILS]);

    // ─ Users ─────────────────────────────────────────────────────────────────
    console.log('👤  Creating demo users…');

    const { rows: [emp] } = await client.query(`
      INSERT INTO users (email, password_hash, name, role, company, is_verified, is_active, terms_accepted_at)
      VALUES ($1, $2, 'Alex Morgan', 'employer', 'TechCorp', true, true, NOW()) RETURNING id`,
      ['demo@techcorp.com', hash]);

    const { rows: [sPro] } = await client.query(`
      INSERT INTO users (email, password_hash, name, role, company, is_verified, is_active, terms_accepted_at)
      VALUES ($1, $2, 'Dana Lee', 'employer', 'StaffingPro', true, true, NOW()) RETURNING id`,
      ['staffingpro@vmdemo.com', hash]);

    const { rows: [tFirst] } = await client.query(`
      INSERT INTO users (email, password_hash, name, role, company, is_verified, is_active, terms_accepted_at)
      VALUES ($1, $2, 'Chris Patel', 'employer', 'TalentFirst', true, true, NOW()) RETURNING id`,
      ['talentfirst@vmdemo.com', hash]);

    // Jobseekers for talent directory
    const { rows: [sarah] } = await client.query(`
      INSERT INTO users (email, password_hash, name, role, headline, publicly_discoverable, allow_employer_contact, years_experience, location, is_verified, terms_accepted_at)
      VALUES ($1, $2, 'Sarah Chen', 'jobseeker', 'Full-Stack Developer · React & Node.js', true, true, 5, 'Austin, TX', true, NOW()) RETURNING id`,
      ['sarah.chen@vmdemo.com', hash]);

    const { rows: [marcus] } = await client.query(`
      INSERT INTO users (email, password_hash, name, role, headline, publicly_discoverable, allow_employer_contact, years_experience, location, is_verified, terms_accepted_at)
      VALUES ($1, $2, 'Marcus Osei', 'jobseeker', 'Data Scientist · ML & Python', true, true, 7, 'Remote', true, NOW()) RETURNING id`,
      ['marcus.osei@vmdemo.com', hash]);

    const { rows: [priya] } = await client.query(`
      INSERT INTO users (email, password_hash, name, role, headline, publicly_discoverable, allow_employer_contact, years_experience, location, is_verified, terms_accepted_at)
      VALUES ($1, $2, 'Priya Nair', 'jobseeker', 'Senior UX Designer · Figma', true, false, 9, 'San Francisco', true, NOW()) RETURNING id`,
      ['priya.nair@vmdemo.com', hash]);

    // ─ Background checks ──────────────────────────────────────────────────────
    console.log('🔍  Creating background checks…');

    // Alice Johnson — all 3 checks, verifying (most complete scenario)
    const { rows: [aliceBG] } = await client.query(`
      INSERT INTO background_checks
        (employer_id, candidate_name, candidate_email, target_role,
         include_reference, include_education, include_criminal,
         status, deadline_days, expires_at, submitted_at)
      VALUES ($1, 'Alice Johnson', 'alice.johnson@demo.com', 'Senior Data Scientist',
              true, true, true, 'verifying', 7, NOW() + INTERVAL '5 days', NOW() - INTERVAL '2 days')
      RETURNING id`, [emp.id]);

    await client.query(`
      INSERT INTO bg_education_entries
        (check_id, institution, degree_type, field_of_study, start_year, graduation_year, gpa,
         verification_status, verification_notes, verified_at)
      VALUES
        ($1, 'University of Texas at Austin', 'Bachelor''s', 'Computer Science',
         2012, 2016, 3.78, 'verified', 'Confirmed with registrar on 2026-07-20 — degree awarded May 2016.', NOW() - INTERVAL '1 day'),
        ($1, 'Georgia Institute of Technology', 'Master''s', 'Data Science',
         2017, 2019, 3.91, 'verifying', null, null)`, [aliceBG.id]);

    await client.query(`
      INSERT INTO bg_criminal_data (check_id, consent_given, consent_at, address, date_of_birth, status)
      VALUES ($1, true, NOW() - INTERVAL '2 days', '4521 Riverside Dr, Austin, TX 78704, USA', '1994-03-15', 'processing')`,
      [aliceBG.id]);

    const { rows: [aliceRR] } = await client.query(`
      INSERT INTO referral_requests (requester_id, requester_role, candidate_name, candidate_email, target_role, bg_check_id, share_token_expires_at)
      VALUES ($1, 'employer', 'Alice Johnson', 'alice.johnson@demo.com', 'Senior Data Scientist', $2, NOW() + INTERVAL '14 days')
      RETURNING id`, [emp.id, aliceBG.id]);

    const aliceRef1 = await addReferrer(client, aliceRR.id, 'Sarah Park',      'sarah.park@demo.com',    'completed', 5);
    const aliceRef2 = await addReferrer(client, aliceRR.id, 'Michael Torres',  'michael.torres@demo.com','completed', 4);
    await addReferrer(client, aliceRR.id, 'Robert Kim', 'robert.kim@demo.com', 'viewed');

    await addReport(client, aliceRef1, REPORT_ALICE_REF1);
    await addReport(client, aliceRef2, REPORT_ALICE_REF2);

    // Bob Smith — reference only, submitted (reports ready, 1 ref outstanding)
    const { rows: [bobBG] } = await client.query(`
      INSERT INTO background_checks
        (employer_id, candidate_name, candidate_email, target_role,
         include_reference, include_education, include_criminal,
         status, deadline_days, expires_at, submitted_at)
      VALUES ($1, 'Bob Smith', 'bob.smith@demo.com', 'Lead Software Engineer',
              true, false, false, 'submitted', 7, NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 day')
      RETURNING id`, [emp.id]);

    const { rows: [bobRR] } = await client.query(`
      INSERT INTO referral_requests (requester_id, requester_role, candidate_name, candidate_email, target_role, bg_check_id, share_token_expires_at)
      VALUES ($1, 'employer', 'Bob Smith', 'bob.smith@demo.com', 'Lead Software Engineer', $2, NOW() + INTERVAL '14 days')
      RETURNING id`, [emp.id, bobBG.id]);

    const bobRef1 = await addReferrer(client, bobRR.id, 'Jennifer Park', 'jennifer.park@demo.com', 'completed', 5);
    const bobRef2 = await addReferrer(client, bobRR.id, 'James Chen',   'james.chen@demo.com',    'completed', 4);
    await addReferrer(client, bobRR.id, 'Lisa Wong', 'lisa.wong@demo.com', 'invited');

    await addReport(client, bobRef1, REPORT_BOB_REF1);
    await addReport(client, bobRef2, REPORT_BOB_REF2);

    // Carol White — education only, in_progress (form opened, not submitted)
    await client.query(`
      INSERT INTO background_checks
        (employer_id, candidate_name, candidate_email, target_role,
         include_reference, include_education, include_criminal,
         status, deadline_days, expires_at)
      VALUES ($1, 'Carol White', 'carol.white@demo.com', 'Product Designer',
              false, true, false, 'in_progress', 7, NOW() + INTERVAL '6 days')`, [emp.id]);

    // David Lee — all 3, invited (nothing done)
    await client.query(`
      INSERT INTO background_checks
        (employer_id, candidate_name, candidate_email, target_role,
         include_reference, include_education, include_criminal,
         status, deadline_days, expires_at)
      VALUES ($1, 'David Lee', 'david.lee@demo.com', 'DevOps Engineer',
              true, true, true, 'invited', 7, NOW() + INTERVAL '7 days')`, [emp.id]);

    // Emma Davis — reference only, declined
    await client.query(`
      INSERT INTO background_checks
        (employer_id, candidate_name, candidate_email, target_role,
         include_reference, include_education, include_criminal,
         status, deadline_days, expires_at, declined_at)
      VALUES ($1, 'Emma Davis', 'emma.davis@demo.com', 'Marketing Manager',
              true, false, false, 'declined', 7, NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours')`,
      [emp.id]);

    // Frank Wilson — all 3, invited — DEMO CANDIDATE FORM (fixed token)
    await client.query(`
      INSERT INTO background_checks
        (employer_id, candidate_name, candidate_email, target_role,
         include_reference, include_education, include_criminal,
         status, token, deadline_days, expires_at)
      VALUES ($1, 'Frank Wilson', 'frank.wilson@demo.com', 'Senior Product Manager',
              true, true, true, 'invited', $2, 7, NOW() + INTERVAL '7 days')`,
      [emp.id, DEMO_TOKEN]);

    // ─ Job postings ───────────────────────────────────────────────────────────
    console.log('💼  Creating job postings…');

    const { rows: [flashJob] } = await client.query(`
      INSERT INTO jobs (employer_id, title, description, location, work_requirement, status, is_public, flash_status, flash_expires_at)
      VALUES ($1,
        'Senior Software Engineer',
        E'We are looking for a Senior Software Engineer to join our platform team.\n\nRequirements:\n• 5+ years of backend engineering (Node.js, PostgreSQL)\n• Experience with cloud infrastructure (AWS or GCP)\n• Strong communication skills and collaborative mindset',
        'Austin, TX (Hybrid)', 'Any', 'active', true, 'active', NOW() + INTERVAL '5 days')
      RETURNING id`, [emp.id]);

    const { rows: [vendorJob] } = await client.query(`
      INSERT INTO jobs (employer_id, title, description, location, work_requirement, status, is_public)
      VALUES ($1,
        'Product Manager — Payments',
        'Confidential role open to vendor submissions only. We are expanding our payments product team and looking for a strong PM with fintech experience.',
        'Remote', 'US Citizen', 'active', false)
      RETURNING id`, [emp.id]);

    const { rows: [devopsJob] } = await client.query(`
      INSERT INTO jobs (employer_id, title, description, location, work_requirement, status, is_public)
      VALUES ($1,
        'DevOps / Platform Engineer',
        E'Join our infrastructure team and own the reliability and scalability of our platform.\n\n• CI/CD pipeline design and optimisation\n• Cloud cost management (AWS)\n• Observability tooling (Datadog, Grafana)',
        'Remote', 'Green Card', 'active', true)
      RETURNING id`, [emp.id]);

    await client.query(`
      INSERT INTO jobs (employer_id, title, description, location, work_requirement, status, is_public)
      VALUES ($1, 'UX Designer', 'This role has been filled.', 'Austin, TX', 'Any', 'closed', true)`,
      [emp.id]);

    // Applicants for DevOps role (with AI matching scores)
    await client.query(`
      INSERT INTO job_applications (job_id, applicant_name, applicant_email, message, resume_text, fit_score, fit_rationale)
      VALUES
        ($1, 'James Rivera', 'james.rivera@example.com',
         'Excited to apply — 6 years running Kubernetes clusters on AWS and a strong passion for developer tooling.',
         E'James Rivera · Senior DevOps Engineer · 6 years\nAWS Certified Solutions Architect\n\nKey achievements:\n• Reduced deployment time 70% via GitHub Actions migration\n• Managed 200-node Kubernetes cluster at 99.98% uptime\n• Built internal observability platform (Grafana + Prometheus)',
         87,
         'Strong Kubernetes and AWS background directly matches role. Quantified achievements demonstrate real impact. Green Card satisfies work requirement.'),
        ($1, 'Aisha Patel', 'aisha.patel@example.com',
         'Four years building CI/CD pipelines and cloud infrastructure — would love to bring that to TechCorp.',
         null, 74,
         'Solid CI/CD and cloud experience. Slightly less Kubernetes depth than top candidate but strong overall profile with relevant tooling exposure.'),
        ($1, 'Tom Bradley', 'tom.bradley@example.com',
         'Applying for the DevOps role — please see my details.', null, null, null)`,
      [devopsJob.id]);

    // Applicants for flash job
    await client.query(`
      INSERT INTO job_applications (job_id, applicant_name, applicant_email, message)
      VALUES
        ($1, 'Maya Okonkwo', 'maya.okonkwo@example.com', '7 years of Node.js and distributed systems — very interested in this role.'),
        ($1, 'Ryan Park',    'ryan.park@example.com',    'My background in platform engineering looks like a strong fit.')`,
      [flashJob.id]);

    // ─ Jobseeker reference pipelines ─────────────────────────────────────────
    console.log('👥  Creating jobseeker reference pipelines…');

    // Sarah Chen — 2 completed refs with AI reports, 1 still invited
    const { rows: [sarahRR] } = await client.query(`
      INSERT INTO referral_requests (requester_id, requester_role, candidate_name, candidate_email, target_role, share_token_expires_at)
      VALUES ($1, 'jobseeker', 'Sarah Chen', 'sarah.chen@vmdemo.com', 'Senior Full-Stack Engineer', NOW() + INTERVAL '14 days')
      RETURNING id`, [sarah.id]);

    const sarahRef1 = await addReferrer(client, sarahRR.id, 'Mei Lin',    'mei.lin@demo.com',    'completed', 5);
    const sarahRef2 = await addReferrer(client, sarahRR.id, 'David Park', 'david.park@demo.com', 'completed', 4);
    await addReferrer(client, sarahRR.id, 'Tom Bradley', 'tom.bradley@demo.com', 'invited');

    await addReport(client, sarahRef1, REPORT_SARAH_REF1);
    await addReport(client, sarahRef2, REPORT_SARAH_REF2);

    // Sarah applied to the flash job
    await client.query(`
      INSERT INTO job_applications (job_id, applicant_name, applicant_email, message)
      VALUES ($1, 'Sarah Chen', 'sarah.chen@vmdemo.com', 'Five years building full-stack products with React and Node.js — excited about this role.')`,
      [flashJob.id]);

    // Marcus Osei — 1 completed ref with AI report, 1 viewed, 1 invited
    const { rows: [marcusRR] } = await client.query(`
      INSERT INTO referral_requests (requester_id, requester_role, candidate_name, candidate_email, target_role, share_token_expires_at)
      VALUES ($1, 'jobseeker', 'Marcus Osei', 'marcus.osei@vmdemo.com', 'Lead Data Scientist', NOW() + INTERVAL '14 days')
      RETURNING id`, [marcus.id]);

    const marcusRef1 = await addReferrer(client, marcusRR.id, 'Dr. Amara Nwosu', 'amara.nwosu@demo.com', 'completed', 5);
    await addReferrer(client, marcusRR.id, 'Sofia Reyes',  'sofia.reyes@demo.com',  'viewed');
    await addReferrer(client, marcusRR.id, 'Kevin Zhang',  'kevin.zhang@demo.com',  'invited');

    await addReport(client, marcusRef1, REPORT_MARCUS_REF1);

    // Priya Nair — referrers invited, no responses yet
    const { rows: [priyaRR] } = await client.query(`
      INSERT INTO referral_requests (requester_id, requester_role, candidate_name, candidate_email, target_role, share_token_expires_at)
      VALUES ($1, 'jobseeker', 'Priya Nair', 'priya.nair@vmdemo.com', 'Lead UX Designer', NOW() + INTERVAL '14 days')
      RETURNING id`, [priya.id]);

    await addReferrer(client, priyaRR.id, 'Rachel Kim', 'rachel.kim@demo.com', 'invited');
    await addReferrer(client, priyaRR.id, 'Jordan Lee', 'jordan.lee@demo.com', 'invited');

    // ─ Vendor network ─────────────────────────────────────────────────────────
    console.log('🤝  Creating vendor network…');

    await client.query(`
      INSERT INTO employer_vendor_links (buyer_employer_id, vendor_employer_id, status, approved_at)
      VALUES ($1, $2, 'approved', NOW() - INTERVAL '5 days')`,
      [emp.id, sPro.id]);

    // StaffingPro has already submitted a candidate for the vendor-only PM role
    await client.query(`
      INSERT INTO vendor_submissions (job_id, vendor_employer_id, candidate_name, candidate_email, cover_note, status)
      VALUES ($1, $2,
        'Lena Kovacs', 'lena.kovacs@example.com',
        'Lena has 8 years in fintech product management, most recently at Stripe. I believe she is an excellent fit for the Payments PM role.',
        'submitted')`,
      [vendorJob.id, sPro.id]);

    await client.query(`
      INSERT INTO employer_vendor_links (buyer_employer_id, vendor_employer_id, status)
      VALUES ($1, $2, 'pending')`,
      [emp.id, tFirst.id]);

    await client.query('COMMIT');

    // ─ Summary ────────────────────────────────────────────────────────────────
    console.log('\n✅  Demo data seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('EMPLOYER LOGIN');
    console.log('  Email:    demo@techcorp.com');
    console.log('  Password: Demo1234!');
    console.log('');
    console.log('OTHER LOGINS  (all use Demo1234!)');
    console.log('  staffingpro@vmdemo.com  — StaffingPro  (approved vendor for TechCorp)');
    console.log('  talentfirst@vmdemo.com  — TalentFirst  (pending vendor request)');
    console.log('');
    console.log('JOB SEEKER LOGINS  (all use Demo1234!)');
    console.log('  sarah.chen@vmdemo.com   — Sarah Chen  · Full-Stack Developer · 2 AI reports ready, 1 ref invited');
    console.log('  marcus.osei@vmdemo.com  — Marcus Osei · Data Scientist       · 1 AI report ready, 1 viewed, 1 invited');
    console.log('  priya.nair@vmdemo.com   — Priya Nair  · UX Designer          · 2 referrers invited (no responses yet)');
    console.log('');
    console.log('CANDIDATE INTAKE FORM  (show what the candidate sees)');
    console.log(`  http://localhost:5173/bg/${DEMO_TOKEN}`);
    console.log('  → Frank Wilson · Senior Product Manager · All 3 checks');
    console.log('');
    console.log('BACKGROUND CHECK SCENARIOS');
    console.log('  Alice Johnson  · All 3 checks  · Verifying   — 2 reports ready, edu partially verified, criminal pending');
    console.log('  Bob Smith      · Reference     · Submitted   — 2 AI reports ready, 1 ref still outstanding');
    console.log('  Carol White    · Education     · In Progress — candidate opened form, hasn\'t submitted yet');
    console.log('  David Lee      · All 3 checks  · Invited     — nothing submitted yet');
    console.log('  Emma Davis     · Reference     · Declined    — candidate refused the check');
    console.log('  Frank Wilson   · All 3 checks  · Invited     — use candidate form link above');
    console.log('');
    console.log('JOB POSTINGS');
    console.log('  Senior Software Engineer  · Public  · 🔥 Flash active  · 3 applicants (incl. Sarah Chen)');
    console.log('  Product Manager — Payments· Vendor Only              · 1 vendor submission');
    console.log('  DevOps / Platform Eng.    · Public                   · 3 applicants + AI scores');
    console.log('  UX Designer               · Closed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function addReferrer(client, rrId, name, email, status, rating) {
  const { rows: [r] } = await client.query(`
    INSERT INTO referrers (referral_request_id, name, email, status, submitted_at)
    VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [rrId, name, email, status, status === 'completed' ? new Date(Date.now() - Math.random() * 86400000) : null]);

  if (status === 'completed' && rating) {
    const answers = buildResponses(rating);
    for (const a of answers) {
      await client.query(
        `INSERT INTO responses (referrer_id, question_number, answer_text, rating) VALUES ($1, $2, $3, $4)`,
        [r.id, a.q, a.text, a.rating || null]);
    }
  }
  return r.id;
}

async function addReport(client, referrerId, json) {
  await client.query(`
    INSERT INTO reports (referrer_id, llm_output_json, share_token_expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '14 days')`,
    [referrerId, JSON.stringify(json)]);
}

function buildResponses(rating) {
  const strong = rating >= 5;
  return [
    { q: 1,  text: `I worked directly with this candidate for over ${strong ? 'three' : 'two'} years as their ${strong ? 'direct manager' : 'peer and close collaborator'}.` },
    { q: 2,  text: strong ? 'Among the top performers I have managed — consistently exceeds expectations.' : 'Consistently solid performer who delivers reliably on commitments.', rating },
    { q: 3,  text: strong ? '(1) Technical depth and end-to-end ownership. (2) Clear and concise communication. (3) Elevates those around them.' : '(1) Strong analytical thinking. (2) Reliable follow-through. (3) Collaborative working style.' },
    { q: 4,  text: strong ? 'When our primary database went down mid-afternoon they diagnosed the root cause in minutes, led the incident response calmly, and restored service in under 30 minutes.' : 'They navigated a difficult stakeholder conflict by bringing all parties together and driving consensus on a pragmatic path forward.' },
    { q: 5,  text: 'Excellent team player — always willing to help others and contributes positively to team culture.', rating: Math.min(5, rating) },
    { q: 6,  text: strong ? 'Outstanding communicator — written updates are models of clarity and presentations are well-structured and persuasive.' : 'Clear and professional communicator in both writing and meetings.', rating: Math.min(5, rating) },
    { q: 7,  text: 'Yes, absolutely — without hesitation.' },
    { q: 8,  text: strong ? 'A high-autonomy environment where they can take full ownership of a domain and drive it end-to-end.' : 'A structured environment with clear goals and a collaborative team.' },
    { q: 9,  text: strong ? 'Enormous growth in executive communication over the past 18 months — from pure technical contributor to someone who can influence strategic decisions.' : 'Strong growth in cross-functional collaboration. Further development in executive-level stakeholder management would round them out.' },
    { q: 10, text: strong ? 'I would be very surprised if this candidate is not hired — they make entire teams better. I genuinely hope our paths cross professionally again.' : 'A solid professional who brings consistent value. A strong addition to any team looking for a reliable, motivated contributor.' },
  ];
}

main();
