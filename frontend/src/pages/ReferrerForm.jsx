import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';

const QUESTIONS = [
  { n: 1, text: 'How long have you known this person and in what capacity?', type: 'text' },
  { n: 2, text: 'On a scale of 1–5, how would you rate their overall job performance?', type: 'rating', detail: true },
  { n: 3, text: 'What are their top 3 professional strengths?', type: 'text' },
  { n: 4, text: 'Describe a situation where they handled a challenging problem or conflict.', type: 'text' },
  { n: 5, text: 'On a scale of 1–5, how do you rate their collaboration and teamwork skills?', type: 'rating', detail: true },
  { n: 6, text: 'On a scale of 1–5, how do you rate their communication (written & verbal)?', type: 'rating', detail: true },
  { n: 7, text: 'Would you rehire or work with this person again? If not, why?', type: 'text' },
  { n: 8, text: 'What type of role or environment do you think they would thrive in most?', type: 'text' },
  { n: 9, text: 'Is there any area where they have shown significant growth or still need to develop?', type: 'text' },
  { n: 10, text: 'Any additional comments you\'d like to share about this candidate?', type: 'text' },
];

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

export default function ReferrerForm() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const autoAction = searchParams.get('action'); // 'decline' | 'call' (from reminder email links)
  const [referrer, setReferrer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('loading'); // loading | form | submitted | declined | call_requested | error
  const [actionLoading, setActionLoading] = useState(null); // 'decline' | 'call'

  useEffect(() => {
    api.get(`/api/referrers/${token}`)
      .then(async r => {
        const data = r.data;
        if (data.status === 'completed') { setStatus('submitted'); return; }
        if (data.status === 'declined') { setStatus('declined'); return; }
        if (data.status === 'call_requested') { setStatus('call_requested'); return; }

        // Auto-trigger action from reminder email link (?action=decline or ?action=call)
        if (autoAction === 'decline') {
          try { await api.post(`/api/referrers/${token}/decline`); } catch {}
          setStatus('declined');
          return;
        }
        if (autoAction === 'call') {
          try { await api.post(`/api/referrers/${token}/call-request`); } catch {}
          setStatus('call_requested');
          return;
        }

        setReferrer(data);
        setStatus('form');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const setAnswer = (n, field, value) => {
    setAnswers(prev => ({ ...prev, [n]: { ...prev[n], [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = QUESTIONS.map(q => ({
      questionNumber: q.n,
      answerText: answers[q.n]?.text || '',
      rating: answers[q.n]?.rating || null,
    }));
    try {
      await api.post(`/api/referrers/${token}/submit`, { answers: payload });
      setStatus('submitted');
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    }
  };

  const handleDecline = async () => {
    setActionLoading('decline');
    try {
      await api.post(`/api/referrers/${token}/decline`);
      setStatus('declined');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCallRequest = async () => {
    setActionLoading('call');
    try {
      await api.post(`/api/referrers/${token}/call-request`);
      setStatus('call_requested');
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (status === 'error') return <TerminalScreen icon="⚠️" title="Link unavailable" message="This link is invalid or has expired." />;
  if (status === 'submitted') return <TerminalScreen icon="✅" title="Thank you!" message="Your reference has been submitted successfully." />;
  if (status === 'declined') return <TerminalScreen icon="👋" title="Response recorded" message="You've declined this reference request. The requester has been notified." />;
  if (status === 'call_requested') return <TerminalScreen icon="📞" title="Call request noted" message="The requester will reach out to schedule a call with you." />;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2"><Logo height={36} /></div>
          <h1 className="text-2xl font-bold">Reference for {referrer.candidate_name}</h1>
          {referrer.target_role && <p className="text-gray-500 mt-1">Role: {referrer.target_role}</p>}
          <p className="text-gray-400 text-sm mt-2">10 questions · ~5 minutes</p>
        </div>

        {/* Secondary actions */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={handleDecline}
            disabled={!!actionLoading}
            className="text-sm text-gray-500 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            {actionLoading === 'decline' ? 'Declining…' : 'Decline'}
          </button>
          <button
            type="button"
            onClick={handleCallRequest}
            disabled={!!actionLoading}
            className="text-sm text-purple-600 border border-purple-300 px-4 py-2 rounded-lg hover:bg-purple-50 transition disabled:opacity-50"
          >
            {actionLoading === 'call' ? 'Requesting…' : 'Request a Call'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {QUESTIONS.map(q => (
            <div key={q.n} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-xs font-medium text-teal-600 mb-2">Question {q.n} of 10</div>
              <p className="font-medium text-gray-800 mb-4">{q.text}</p>
              {q.type === 'rating' && (
                <div className="flex gap-3 mb-3">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button"
                      onClick={() => setAnswer(q.n, 'rating', v)}
                      className={`w-10 h-10 rounded-full border-2 font-semibold text-sm transition ${answers[q.n]?.rating === v ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 text-gray-600 hover:border-teal-400'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
              <textarea rows={q.type === 'rating' ? 2 : 4}
                placeholder={q.type === 'rating' ? 'Add any context (optional)...' : 'Your answer...'}
                value={answers[q.n]?.text || ''}
                onChange={e => setAnswer(q.n, 'text', e.target.value)}
                required={q.type === 'text'}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
          ))}

          <button type="submit"
            className="w-full bg-teal-600 text-white py-4 rounded-xl font-semibold hover:bg-teal-700 transition text-lg">
            Submit Reference
          </button>
        </form>
      </div>
    </div>
  );
}
