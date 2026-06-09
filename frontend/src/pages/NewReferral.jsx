import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function NewReferral() {
  const [targetRole, setTargetRole] = useState('');
  const [referrers, setReferrers] = useState([{ name: '', email: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addReferrer = () => setReferrers([...referrers, { name: '', email: '' }]);
  const updateReferrer = (i, field, value) => {
    const updated = [...referrers];
    updated[i][field] = value;
    setReferrers(updated);
  };
  const removeReferrer = (i) => setReferrers(referrers.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/referrals', { targetRole, referrers });
      navigate(`/references/${res.data.referralRequest.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <Link to="/dashboard" className="text-xl font-bold text-indigo-700">← Dashboard</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">New Referral Request</h1>
        <p className="text-gray-500 mb-8">Your referrers will receive an email with a 10-question form.</p>

        {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Role (optional)</label>
            <input type="text" placeholder="e.g. Senior Product Manager at Stripe"
              value={targetRole} onChange={e => setTargetRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Referrers</label>
              {referrers.length < 5 && (
                <button type="button" onClick={addReferrer}
                  className="text-sm text-indigo-600 hover:text-indigo-800">+ Add another</button>
              )}
            </div>
            <div className="space-y-3">
              {referrers.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <input type="text" placeholder="Name" required value={r.name}
                    onChange={e => updateReferrer(i, 'name', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="email" placeholder="Email" required value={r.email}
                    onChange={e => updateReferrer(i, 'email', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {referrers.length > 1 && (
                    <button type="button" onClick={() => removeReferrer(i)}
                      className="text-gray-400 hover:text-red-500 px-2">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
            {loading ? 'Sending invites...' : 'Send Referral Invites'}
          </button>
        </form>
      </main>
    </div>
  );
}
