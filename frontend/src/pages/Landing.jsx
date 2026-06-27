import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SAMPLE from '../sampleReportData';
import Logo from '../components/Logo';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const HOW_IT_WORKS = [
  { step: '01', title: 'Request references', desc: 'Enter the candidate details and invite referees by email. Each referee gets a secure, unique link.' },
  { step: '02', title: 'Referees respond', desc: '10 structured questions covering performance, teamwork, communication and growth — takes 5 minutes.' },
  { step: '03', title: 'Get your AI report', desc: 'The moment a referee submits, an AI-generated report is ready — scores, insights, and notable quotes.' },
];

const EMPLOYER_BENEFITS = [
  'Replace unstructured phone calls with consistent data',
  'Compare candidates objectively with standardised scores',
  'Reports ready in minutes, not days',
  'Full candidate pipeline in one dashboard',
];

const SEEKER_BENEFITS = [
  'Know exactly what your references are saying',
  'Share a polished report with any employer instantly',
  'One link — no more chasing referees per application',
  'Build a reusable reference profile over your career',
];

function FlashApplyForm({ jobId, onSent }) {
  const [message, setMessage] = useState('');
  const [resumeMode, setResumeMode] = useState('none'); // none | upload | paste
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const formData = new FormData();
      if (message) formData.append('message', message);
      if (resumeMode === 'upload' && resumeFile) formData.append('resume', resumeFile);
      if (resumeMode === 'paste' && resumeText) formData.append('resumeText', resumeText);
      await api.post(`/api/jobs/${jobId}/apply`, formData);
      onSent();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-orange-100 pt-3">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <textarea rows={2} placeholder="Optional note to the employer" value={message}
        onChange={e => setMessage(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />

      <select value={resumeMode} onChange={e => setResumeMode(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
        <option value="none">Don't include a resume</option>
        <option value="upload">Upload a resume file (.pdf, .doc, .docx)</option>
        <option value="paste">Paste my resume text</option>
      </select>

      {resumeMode === 'upload' && (
        <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files[0])}
          className="w-full text-sm" />
      )}
      {resumeMode === 'paste' && (
        <textarea rows={5} placeholder="Paste your resume text here" value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      )}

      <button type="submit" disabled={sending}
        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50">
        {sending ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  );
}

function FlashJobsSection() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [sentIds, setSentIds] = useState([]);

  useEffect(() => {
    api.get('/api/jobs/flash').then(r => {
      setJobs(r.data);
      setLoaded(true);
    });
  }, []);

  if (loaded && jobs.length === 0) return null;

  return (
    <section className="bg-orange-50 border-y border-orange-100 py-14 px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-3">
            🔥 Flash Jobs
          </div>
          <h2 className="text-2xl font-bold">Featured openings, hiring now</h2>
        </div>

        {!loaded ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-800">{job.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{job.company}</div>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap ml-3">🔥 Flash</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-3">
                  {job.location && <span>📍 {job.location}</span>}
                  {job.work_requirement && <span>🪪 {job.work_requirement}</span>}
                </div>

                {job.description && <p className="text-sm text-gray-600 mt-3">{job.description}</p>}

                {job.already_applied || sentIds.includes(job.id) ? (
                  <button disabled
                    className="mt-3 text-sm border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed">
                    ✓ Applied
                  </button>
                ) : !user ? (
                  <Link to="/register?role=jobseeker"
                    className="mt-3 inline-block text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
                    Log in to Apply
                  </Link>
                ) : user.role !== 'jobseeker' ? (
                  <button disabled title="Only job seeker accounts can apply"
                    className="mt-3 text-sm border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed">
                    Job Seekers Only
                  </button>
                ) : openId === job.id ? (
                  <FlashApplyForm jobId={job.id} onSent={() => { setOpenId(null); setSentIds(ids => [...ids, job.id]); }} />
                ) : (
                  <button onClick={() => setOpenId(job.id)}
                    className="mt-3 text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
                    Apply
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/jobs" className="text-sm text-orange-700 hover:underline font-medium">View all Open Roles →</Link>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-5 max-w-6xl mx-auto border-b border-gray-100">
        <Logo to="/" height={100} />
        <div className="flex gap-3 items-center">
          <Link to="/talent" className="px-4 py-2 text-gray-600 hover:text-teal-700 transition font-medium">Available Talent Pool</Link>
          <Link to="/jobs" className="px-4 py-2 text-gray-600 hover:text-teal-700 transition font-medium">Open Roles</Link>
          <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-teal-700 transition font-medium">Log in</Link>
          <Link to="/register" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-block px-4 py-1 bg-teal-50 text-teal-600 rounded-full text-sm font-medium mb-6 border border-teal-100">
          Now in Beta — Free to use
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6 text-gray-900">
          Professional references that<br />
          <span className="text-teal-600">actually tell you something</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          VouchMetrics replaces vague phone calls with structured feedback and instant AI reports —
          so hiring teams get real insight and candidates get a voice.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/register?role=employer"
            className="px-7 py-3.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition text-lg shadow-sm">
            I'm hiring
          </Link>
          <Link to="/register?role=jobseeker"
            className="px-7 py-3.5 border-2 border-teal-200 text-teal-700 rounded-xl font-semibold hover:bg-teal-50 transition text-lg">
            I'm job seeking
          </Link>
        </div>
      </section>

      <FlashJobsSection />

      {/* Problem bar */}
      <section className="bg-gray-50 border-y border-gray-100 py-10 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-lg">
            The average reference check takes <strong className="text-gray-700">3 phone calls</strong>, <strong className="text-gray-700">2 weeks</strong>, and still produces <strong className="text-gray-700">no structured data</strong>.
            <span className="text-teal-600 font-semibold"> VouchMetrics fixes that.</span>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">How it works</h2>
        <p className="text-gray-500 text-center mb-12">From invite to insight in under 24 hours.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(s => (
            <div key={s.step} className="relative">
              <div className="text-5xl font-black text-teal-100 mb-3">{s.step}</div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample report preview */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">What a report looks like</h2>
        <p className="text-gray-500 text-center mb-10">Every referee submission generates an AI report instantly. Here's a real example.</p>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Report header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <div className="text-xs font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 inline-block mb-2">Sample Report</div>
              <h3 className="font-bold text-lg">{SAMPLE.candidate_name}</h3>
              <p className="text-gray-500 text-sm">{SAMPLE.target_role} · Reference by {SAMPLE.referrer_name}</p>
            </div>
            <div className="text-center bg-teal-50 rounded-xl px-5 py-2 border border-teal-100">
              <div className="text-2xl font-bold text-teal-700">{SAMPLE.llm_output_json.confidenceScore}%</div>
              <div className="text-xs text-gray-500">Confidence</div>
            </div>
          </div>

          {/* Executive summary */}
          <div className="p-6 border-b border-gray-100 bg-teal-50">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">Executive Summary</p>
            <p className="text-gray-700 text-sm leading-relaxed">{SAMPLE.llm_output_json.executiveSummary}</p>
          </div>

          {/* Scores */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Competency Scores</p>
            <div className="space-y-3">
              {Object.entries(SAMPLE.llm_output_json.scores).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-36 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${(val / 5) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right">{val}/5</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="p-6 border-b border-gray-100">
            <blockquote className="border-l-4 border-teal-300 pl-4 text-gray-600 italic text-sm">
              "{SAMPLE.llm_output_json.notableQuotes[0]}"
            </blockquote>
          </div>

          {/* See full report link */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <Link to="/sample-report" className="text-sm text-teal-600 hover:text-teal-800 font-semibold">
              View full sample report →
            </Link>
          </div>
        </div>
      </section>

      {/* Dual audience */}
      <section className="bg-gray-50 border-y border-gray-100 py-20 px-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">

          {/* Employers */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">🏢</div>
            <h3 className="text-xl font-bold mb-2">For hiring teams</h3>
            <p className="text-gray-500 text-sm mb-6">Stop spending hours on reference calls. Get structured data that helps you make better hires, faster.</p>
            <ul className="space-y-3">
              {EMPLOYER_BENEFITS.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-teal-500 mt-0.5 flex-shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
            <Link to="/register?role=employer"
              className="mt-8 block text-center px-5 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition">
              Start hiring smarter
            </Link>
          </div>

          {/* Job seekers */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">👤</div>
            <h3 className="text-xl font-bold mb-2">For job seekers</h3>
            <p className="text-gray-500 text-sm mb-6">Take control of your references. Build a reusable profile that travels with you across every application.</p>
            <ul className="space-y-3">
              {SEEKER_BENEFITS.map(b => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-teal-500 mt-0.5 flex-shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
            <Link to="/register?role=jobseeker"
              className="mt-8 block text-center px-5 py-3 border-2 border-teal-200 text-teal-700 rounded-xl font-semibold hover:bg-teal-50 transition">
              Build my reference profile
            </Link>
          </div>
        </div>
      </section>

      {/* Beta CTA */}
      <section className="max-w-3xl mx-auto px-8 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Join the beta — it's free</h2>
        <p className="text-gray-500 mb-8 text-lg">
          VouchMetrics is free during beta. Be among the first teams to replace reference calls with real insight.
        </p>
        <Link to="/register"
          className="inline-block px-8 py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 transition shadow-sm">
          Get started for free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-gray-400">
          <Logo height={28} />
          <div className="flex gap-4">
            <span>© {new Date().getFullYear()} VouchMetrics</span>
            <Link to="/terms" className="hover:text-gray-600 transition">Terms & Conditions</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
