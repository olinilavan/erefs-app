import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function EmployerDashboard() {
  const { user, logout } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', targetRole: '', referrers: [{ name: '', email: '' }] });

  useEffect(() => {
    axios.get('/api/employer/candidates').then(r => setCandidates(r.data));
  }, []);

  const addReferrer = () => setForm({ ...form, referrers: [...form.referrers, { name: '', email: '' }] });
  const updateReferrer = (i, field, value) => {
    const updated = [...form.referrers];
    updated[i][field] = value;
    setForm({ ...form, referrers: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/referrals', {
      candidateName: form.candidateName,
      candidateEmail: form.candidateEmail,
      targetRole: form.targetRole,
      referrers: form.referrers,
    });
    const res = await axios.get('/api/employer/candidates');
    setCandidates(res.data);
    setShowNewRequest(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-700">eRefs<span className="text-gray-400">.ai</span></Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.company || user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Candidate Pipeline</h1>
            <p className="text-gray-500 text-sm mt-1">Request and track reference checks for candidates</p>
          </div>
          <button onClick={() => setShowNewRequest(true)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            + Request Reference
          </button>
        </div>

        {showNewRequest && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
            <h2 className="font-semibold mb-6">New Reference Check</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Candidate name" required value={form.candidateName}
                  onChange={e => setForm({ ...form, candidateName: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="email" placeholder="Candidate email" required value={form.candidateEmail}
                  onChange={e => setForm({ ...form, candidateEmail: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <input type="text" placeholder="Role (e.g. Senior Engineer)" value={form.targetRole}
                onChange={e => setForm({ ...form, targetRole: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Referrers</span>
                  <button type="button" onClick={addReferrer} className="text-sm text-indigo-600">+ Add</button>
                </div>
                {form.referrers.map((r, i) => (
                  <div key={i} className="flex gap-3 mb-2">
                    <input type="text" placeholder="Referrer name" required value={r.name}
                      onChange={e => updateReferrer(i, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="email" placeholder="Referrer email" required value={r.email}
                      onChange={e => updateReferrer(i, 'email', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                  Send Invites
                </button>
                <button type="button" onClick={() => setShowNewRequest(false)}
                  className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Candidate', 'Role', 'References', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{c.candidate_name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{c.target_role || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.completed_referrers}/{c.total_referrers}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/references/${c.id}`} className="text-sm text-indigo-600 hover:underline font-medium">Details</Link>
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No candidates yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
