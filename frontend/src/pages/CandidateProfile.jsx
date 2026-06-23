import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';

function TerminalScreen({ icon, title, message }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-8">
      <div>
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export default function CandidateProfile() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | form | submitted | error
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/candidate-profile/${token}`)
      .then(r => {
        if (r.data.submitted) { setStatus('submitted'); return; }
        setName(r.data.name);
        setTargetRole(r.data.targetRole);
        setStatus('form');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!summary.trim()) {
      setError('Please write a short summary before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/candidate-profile/${token}/submit`, { professionalSummary: summary });
      setStatus('submitted');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  if (status === 'error') return (
    <TerminalScreen icon="🔒" title="Link invalid or expired"
      message="This link is no longer valid. If you believe this is a mistake, please contact whoever requested your reference report." />
  );

  if (status === 'submitted') return (
    <TerminalScreen icon="✅" title="Thank you!"
      message="Your professional summary has been added to your reference report." />
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8"><Logo height={36} /></div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold mb-1">Add your professional summary</h1>
          <p className="text-gray-500 text-sm mb-1">
            {name ? `Hi ${name}, ` : ''}this is entirely optional and only uses what you choose to share here.
          </p>
          {targetRole && <p className="text-gray-400 text-xs mb-6">For the {targetRole} role</p>}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Tell us about your experience, skills, and background — in your own words
              </label>
              <textarea
                rows={8}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="e.g. I'm a software engineer with 6 years of experience building backend systems at Acme Corp and Beta Inc. I specialize in distributed systems and have led a team of 4 engineers..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-gray-400 mt-1">Tip: you can paste your LinkedIn "About" section here if you have one.</p>
            </div>

            {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

            <button type="submit" disabled={submitting}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Summary'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
