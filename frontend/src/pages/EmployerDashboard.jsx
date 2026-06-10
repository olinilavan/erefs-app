import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AccountDropdown from '../components/AccountDropdown';

const STATUS_STYLE = {
  completed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
};

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
        <p className="text-gray-800 font-medium mb-1">Are you sure?</p>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('active');
  const [candidates, setCandidates] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    candidateName: '', candidateEmail: '', targetRole: '',
    referrers: [{ name: '', email: '' }],
  });

  function load(archived = false) {
    api.get(`/api/employer/candidates?archived=${archived}`).then(r => setCandidates(r.data));
  }

  useEffect(() => { load(tab === 'archived'); }, [tab]);

  const addReferrer = () => setForm({ ...form, referrers: [...form.referrers, { name: '', email: '' }] });
  const updateReferrer = (i, field, value) => {
    const updated = [...form.referrers];
    updated[i][field] = value;
    setForm({ ...form, referrers: updated });
  };
  const removeReferrer = (i) => setForm({ ...form, referrers: form.referrers.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/api/referrals', {
      candidateName: form.candidateName,
      candidateEmail: form.candidateEmail,
      targetRole: form.targetRole,
      referrers: form.referrers,
    });
    setForm({ candidateName: '', candidateEmail: '', targetRole: '', referrers: [{ name: '', email: '' }] });
    setShowNewRequest(false);
    load(false);
  };

  async function archive(id) {
    await api.patch(`/api/employer/candidates/${id}/archive`);
    load(false);
  }

  async function unarchive(id) {
    await api.patch(`/api/employer/candidates/${id}/unarchive`);
    load(true);
  }

  async function confirmDelete() {
    await api.delete(`/api/employer/candidates/${deleteTarget}`);
    setDeleteTarget(null);
    load(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {deleteTarget && (
        <ConfirmModal
          message="This will permanently delete the candidate, all referrer responses and reports. This cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-700">eRefs<span className="text-gray-400">.ai</span></Link>
        <AccountDropdown />
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Candidate Pipeline</h1>
            <p className="text-gray-500 text-sm mt-1">Request and track reference checks for candidates</p>
          </div>
          {tab === 'active' && (
            <button onClick={() => setShowNewRequest(true)}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
              + Request Reference
            </button>
          )}
        </div>

        {/* New request form */}
        {showNewRequest && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
            <h2 className="font-semibold mb-6">New Reference Check</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Candidate name" required value={form.candidateName}
                  onChange={e => setForm({ ...form, candidateName: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="email" placeholder="Candidate email" value={form.candidateEmail}
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
                    {form.referrers.length > 1 && (
                      <button type="button" onClick={() => removeReferrer(i)}
                        className="text-gray-400 hover:text-red-500 px-2 transition">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
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

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
          {['active', 'archived'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
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
                  <td className="px-6 py-4">
                    <div className="font-medium">{c.candidate_name}</div>
                    {c.candidate_email && <div className="text-xs text-gray-400">{c.candidate_email}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{c.target_role || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.completed_referrers}/{c.total_referrers}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link to={`/references/${c.id}`}
                        className="text-sm text-indigo-600 hover:underline font-medium">
                        Details
                      </Link>
                      {tab === 'active' && (
                        <button onClick={() => archive(c.id)}
                          className="text-xs text-gray-400 hover:text-yellow-600 transition">
                          Archive
                        </button>
                      )}
                      {tab === 'archived' && (
                        <>
                          <button onClick={() => unarchive(c.id)}
                            className="text-xs text-gray-400 hover:text-indigo-600 transition">
                            Restore
                          </button>
                          <button onClick={() => setDeleteTarget(c.id)}
                            className="text-xs text-gray-400 hover:text-red-600 transition">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    {tab === 'archived' ? 'No archived candidates' : 'No candidates yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
