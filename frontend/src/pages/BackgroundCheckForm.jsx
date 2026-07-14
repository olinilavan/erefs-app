import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';

const DEGREE_TYPES = ["Bachelor's", "Master's", "PhD", "Associate's", "Diploma", "Certificate", "Other"];

function SectionHeading({ num, title, subtitle }) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </div>
      <div>
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Reference section ────────────────────────────────────────────────────────
function ReferenceSection({ references, onChange }) {
  function add() {
    onChange([...references, { name: '', email: '', company: '', relationship: '' }]);
  }
  function update(i, field, value) {
    const next = [...references];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  }
  function remove(i) {
    onChange(references.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      {references.map((r, i) => (
        <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Reference {i + 1}</span>
            {references.length > 2 && (
              <button type="button" onClick={() => remove(i)}
                className="text-xs text-gray-400 hover:text-red-500 transition">Remove</button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input type="text" placeholder="Full name *" required value={r.name}
              onChange={e => update(i, 'name', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <input type="email" placeholder="Email address *" required value={r.email}
              onChange={e => update(i, 'email', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input type="text" placeholder="Company / organisation (optional)" value={r.company}
              onChange={e => update(i, 'company', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <input type="text" placeholder="Relationship (e.g. Direct Manager)" value={r.relationship}
              onChange={e => update(i, 'relationship', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="text-sm text-teal-600 hover:text-teal-800 font-medium transition">
        + Add another reference
      </button>
    </div>
  );
}

// ── Education section ────────────────────────────────────────────────────────
function EducationSection({ entries, onChange }) {
  function add() {
    onChange([...entries, { institution: '', degreeType: '', fieldOfStudy: '', startYear: '', graduationYear: '', gpa: '' }]);
  }
  function update(i, field, value) {
    const next = [...entries];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  }
  function remove(i) {
    onChange(entries.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      {entries.map((e, i) => (
        <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Degree {i + 1}</span>
            {entries.length > 1 && (
              <button type="button" onClick={() => remove(i)}
                className="text-xs text-gray-400 hover:text-red-500 transition">Remove</button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <select value={e.degreeType} onChange={ev => update(i, 'degreeType', ev.target.value)} required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">Degree type *</option>
              {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="text" placeholder="Institution name *" required value={e.institution}
              onChange={ev => update(i, 'institution', ev.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <input type="text" placeholder="Field of study (e.g. Computer Science)" value={e.fieldOfStudy}
            onChange={ev => update(i, 'fieldOfStudy', ev.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" placeholder="Start year" min="1950" max="2100" value={e.startYear}
              onChange={ev => update(i, 'startYear', ev.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <input type="number" placeholder="Grad year *" required min="1950" max="2100" value={e.graduationYear}
              onChange={ev => update(i, 'graduationYear', ev.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <input type="number" placeholder="GPA (optional)" step="0.01" min="0" max="4" value={e.gpa}
              onChange={ev => update(i, 'gpa', ev.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="text-sm text-teal-600 hover:text-teal-800 font-medium transition">
        + Add another degree
      </button>
    </div>
  );
}

// ── Criminal section ─────────────────────────────────────────────────────────
function CriminalSection({ criminal, onChange }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Criminal background check consent</p>
        <p>This check will be processed in accordance with applicable laws including the Fair Credit Reporting Act (FCRA). You have the right to request a copy of any report obtained.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date of birth *</label>
          <input type="date" required value={criminal.dateOfBirth}
            onChange={e => onChange({ ...criminal, dateOfBirth: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Full address *</label>
        <textarea rows={3} required placeholder="Street address, city, state, ZIP / postal code, country"
          value={criminal.address}
          onChange={e => onChange({ ...criminal, address: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" required checked={criminal.consentGiven}
          onChange={e => onChange({ ...criminal, consentGiven: e.target.checked })}
          className="mt-0.5 accent-teal-600" />
        <span className="text-sm text-gray-700">
          I authorise the requesting employer and VouchMetrics to obtain a criminal background report on my behalf. I understand I may request a copy of any report obtained and have rights under applicable background check laws.
        </span>
      </label>
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────
export default function BackgroundCheckForm() {
  const { token } = useParams();
  const [check, setCheck] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [references, setReferences] = useState([
    { name: '', email: '', company: '', relationship: '' },
    { name: '', email: '', company: '', relationship: '' },
  ]);
  const [education, setEducation] = useState([
    { institution: '', degreeType: '', fieldOfStudy: '', startYear: '', graduationYear: '', gpa: '' },
  ]);
  const [criminal, setCriminal] = useState({ dateOfBirth: '', address: '', consentGiven: false });

  useEffect(() => {
    api.get(`/api/bg/${token}`)
      .then(r => setCheck(r.data))
      .catch(err => {
        const data = err.response?.data;
        setLoadError(data?.error || 'This link is invalid or has expired.');
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/api/bg/${token}/submit`, {
        references: check.include_reference ? references : [],
        education:  check.include_education  ? education  : [],
        criminal:   check.include_criminal   ? criminal   : null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed — please try again.');
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!window.confirm('Are you sure you want to decline this background check? The employer will be notified.')) return;
    try {
      await api.post(`/api/bg/${token}/decline`);
      setDeclined(true);
    } catch {
      setError('Could not decline — please try again.');
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-sm w-full">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-semibold text-gray-800 mb-2">Link unavailable</h2>
          <p className="text-gray-500 text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!check) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading…</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-sm w-full">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="font-semibold text-gray-800 mb-2">All done!</h2>
          <p className="text-gray-500 text-sm">
            Your information has been submitted. {check.include_reference && 'We\'ll reach out to your references shortly.'}
          </p>
        </div>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-sm w-full">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="font-semibold text-gray-800 mb-2">Background check declined</h2>
          <p className="text-gray-500 text-sm">The employer has been notified.</p>
        </div>
      </div>
    );
  }

  const checksRequested = [
    check.include_reference && 'Reference Check',
    check.include_education && 'Education Verification',
    check.include_criminal  && 'Criminal Background Check',
  ].filter(Boolean);

  let sectionNum = 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <Logo to="/" />
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <p className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-1">Background Check Request</p>
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            {check.employer_company || check.employer_name} has requested a background check
          </h1>
          <p className="text-sm text-gray-500">
            For your application as <strong>{check.target_role || 'the role'}</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {checksRequested.map(c => (
              <span key={c} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-full font-medium">{c}</span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {check.include_reference && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <SectionHeading
                num={sectionNum++}
                title="References"
                subtitle="Provide at least 2 professional references. They'll receive a brief questionnaire from VouchMetrics."
              />
              <ReferenceSection references={references} onChange={setReferences} />
            </div>
          )}

          {check.include_education && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <SectionHeading
                num={sectionNum++}
                title="Education"
                subtitle="Add all relevant degrees. We'll verify these with the institutions directly."
              />
              <EducationSection entries={education} onChange={setEducation} />
            </div>
          )}

          {check.include_criminal && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <SectionHeading
                num={sectionNum++}
                title="Criminal Background Check"
                subtitle="Your consent and personal details are required to proceed."
              />
              <CriminalSection criminal={criminal} onChange={setCriminal} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit Background Check'}
            </button>
            <button type="button" onClick={handleDecline}
              className="sm:w-auto px-6 py-3 border border-gray-300 rounded-xl text-sm text-gray-500 hover:text-red-600 hover:border-red-300 transition">
              Decline
            </button>
          </div>

          <p className="text-xs text-center text-gray-400">
            By submitting you confirm all information provided is accurate to the best of your knowledge.
          </p>
        </form>
      </main>
    </div>
  );
}
