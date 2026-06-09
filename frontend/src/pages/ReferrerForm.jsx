import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

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

export default function ReferrerForm() {
  const { token } = useParams();
  const [referrer, setReferrer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('loading'); // loading | form | submitted | error

  useEffect(() => {
    api.get(`/api/referrers/${token}`)
      .then(r => { setReferrer(r.data); setStatus('form'); })
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

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (status === 'error') return (
    <div className="min-h-screen flex items-center justify-center text-center px-8">
      <div><div className="text-5xl mb-4">⚠️</div><p className="text-gray-600">This link is invalid or has expired.</p></div>
    </div>
  );
  if (status === 'submitted') return (
    <div className="min-h-screen flex items-center justify-center text-center px-8">
      <div><div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
        <p className="text-gray-500">Your reference has been submitted successfully.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-2xl font-bold text-indigo-700 mb-2">eRefs<span className="text-gray-400">.ai</span></div>
          <h1 className="text-2xl font-bold">Reference for {referrer.candidate_name}</h1>
          {referrer.target_role && <p className="text-gray-500 mt-1">Role: {referrer.target_role}</p>}
          <p className="text-gray-400 text-sm mt-2">10 questions · ~5 minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {QUESTIONS.map(q => (
            <div key={q.n} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-xs font-medium text-indigo-600 mb-2">Question {q.n} of 10</div>
              <p className="font-medium text-gray-800 mb-4">{q.text}</p>
              {q.type === 'rating' && (
                <div className="flex gap-3 mb-3">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button"
                      onClick={() => setAnswer(q.n, 'rating', v)}
                      className={`w-10 h-10 rounded-full border-2 font-semibold text-sm transition ${answers[q.n]?.rating === v ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          ))}

          <button type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition text-lg">
            Submit Reference
          </button>
        </form>
      </div>
    </div>
  );
}
