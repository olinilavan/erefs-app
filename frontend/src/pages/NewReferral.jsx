import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { isPersonalEmail } from '../utils/emailValidation';

export default function NewReferral() {
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [referrers, setReferrers] = useState([{ name: '', email: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requireWorkEmail, setRequireWorkEmail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/settings').then(r => setRequireWorkEmail(r.data.require_work_email));
  }, []);

  const addReferrer = () => setReferrers([...referrers, { name: '', email: '' }]);
  const updateReferrer = (i, field, value) => {
    const updated = [...referrers];
    updated[i][field] = value;
    setReferrers(updated);
  };
  const removeReferrer = (i) => setReferrers(referrers.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (requireWorkEmail) {
      const personal = referrers.filter(r => r.email && isPersonalEmail(r.email));
      if (personal.length > 0) {
        setError(`Work email required. Please use a corporate email address for: ${personal.map(r => r.name || r.email).join(', ')}`);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await api.post('/api/referrals', { candidateName, candidateEmail, targetRole, referrers });
      navigate(`/references/${res.data.referralRequest.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <Link to="/dashboard" className="text-xl font-bold text-teal-700">← Dashboard</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">New Referral Request</h1>
        <p className="text-gray-500 mb-8">Your referrers will receive an email with a 10-question form.</p>

        {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Candidate details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Candidate Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Candidate Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Alex Chen" required
                  value={candidateName} onChange={e => setCandidateName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Candidate Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="email" placeholder="alex@example.com"
                  value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Target Role <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" placeholder="e.g. Senior Product Manager at Stripe"
                value={targetRole} onChange={e => setTargetRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Referrers</label>
              {referrers.length < 5 && (
                <button type="button" onClick={addReferrer}
                  className="text-sm text-teal-600 hover:text-teal-800">+ Add another</button>
              )}
            </div>
            <div className="space-y-3">
              {referrers.map((r, i) => {
                const emailInvalid = requireWorkEmail && r.email && isPersonalEmail(r.email);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-3">
                      <input type="text" placeholder="Name" required value={r.name}
                        onChange={e => updateReferrer(i, 'name', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <input type="email" placeholder="Work email" required value={r.email}
                        onChange={e => updateReferrer(i, 'email', e.target.value)}
                        className={`flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${emailInvalid ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-500'}`} />
                      {referrers.length > 1 && (
                        <button type="button" onClick={() => removeReferrer(i)}
                          className="text-gray-400 hover:text-red-500 px-2">✕</button>
                      )}
                    </div>
                    {emailInvalid && (
                      <p className="text-xs text-red-500 pl-1">Personal email not allowed — please use a work email address.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50">
            {loading ? 'Sending invites...' : 'Send Referral Invites'}
          </button>
        </form>
      </main>
    </div>
  );
}
