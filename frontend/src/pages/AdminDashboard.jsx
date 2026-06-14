import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', targetRole: '', referrers: [{ name: '', email: '' }] });
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/api/admin/stats').then(r => setStats(r.data));
    api.get('/api/admin/employers').then(r => setEmployers(r.data));
  }, []);

  async function selectEmployer(emp) {
    setSelected(emp);
    setShowNewRequest(false);
    const res = await api.get(`/api/admin/employers/${emp.id}/candidates`);
    setPipeline(res.data);
  }

  async function deactivate(id) {
    await api.patch(`/api/admin/employers/${id}/deactivate`);
    const res = await api.get('/api/admin/employers');
    setEmployers(res.data);
    if (selected?.id === id) setSelected(s => ({ ...s, is_active: false }));
  }

  async function activate(id) {
    await api.patch(`/api/admin/employers/${id}/activate`);
    const res = await api.get('/api/admin/employers');
    setEmployers(res.data);
    if (selected?.id === id) setSelected(s => ({ ...s, is_active: true }));
  }

  async function confirmDelete() {
    await api.delete(`/api/admin/employers/${deleteTarget}`);
    setDeleteTarget(null);
    setSelected(null);
    setPipeline([]);
    const res = await api.get('/api/admin/employers');
    setEmployers(res.data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post(`/api/admin/employers/${selected.id}/referrals`, form);
    setForm({ candidateName: '', candidateEmail: '', targetRole: '', referrers: [{ name: '', email: '' }] });
    setShowNewRequest(false);
    const res = await api.get(`/api/admin/employers/${selected.id}/candidates`);
    setPipeline(res.data);
  }

  const addReferrer = () => setForm({ ...form, referrers: [...form.referrers, { name: '', email: '' }] });
  const updateReferrer = (i, field, value) => {
    const updated = [...form.referrers];
    updated[i][field] = value;
    setForm({ ...form, referrers: updated });
  };
  const removeReferrer = (i) => setForm({ ...form, referrers: form.referrers.filter((_, idx) => idx !== i) });

  const filtered = employers.filter(e =>
    `${e.name} ${e.email} ${e.company}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <p className="text-gray-800 font-semibold mb-1">Delete employer account?</p>
            <p className="text-gray-500 text-sm mb-6">
              This permanently deletes the employer account and all associated candidates, referrers, responses and reports. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-indigo-900 text-white px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-xl font-bold">eRefs<span className="text-indigo-300">.ai</span></Link>
          <span className="text-xs bg-indigo-700 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <button onClick={logout} className="text-sm text-indigo-300 hover:text-white transition">Logout</button>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-8">

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Employers', value: stats.total_employers },
              { label: 'Job Seekers', value: stats.total_jobseekers },
              { label: 'Referral Requests', value: stats.total_requests },
              { label: 'Submissions', value: stats.total_submissions },
              { label: 'Reports Generated', value: stats.total_reports },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-indigo-700">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">

          {/* Employer list */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-3">Employers</h2>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, company…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {filtered.map(emp => (
                <div key={emp.id}
                  className={`w-full px-5 py-4 border-b border-gray-50 ${selected?.id === emp.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : emp.is_active ? '' : 'bg-gray-50 opacity-60'}`}>
                  <button onClick={() => selectEmployer(emp)} className="w-full text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="font-medium text-sm text-gray-800">{emp.company || emp.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {emp.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{emp.email}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{emp.active_requests} active requests</div>
                  </button>
                  <div className="flex gap-3 mt-2">
                    {emp.is_active ? (
                      <button onClick={() => deactivate(emp.id)}
                        className="text-xs text-yellow-600 hover:text-yellow-800 font-medium transition">
                        Deactivate
                      </button>
                    ) : (
                      <>
                        <button onClick={() => activate(emp.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">
                          Restore
                        </button>
                        <button onClick={() => setDeleteTarget(emp.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">No employers found</div>
              )}
            </div>
          </div>

          {/* Pipeline for selected employer */}
          <div className="col-span-2 space-y-4">
            {selected ? (
              <>
                <div className={`bg-white rounded-2xl border p-5 flex justify-between items-start ${!selected.is_active ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-800">{selected.company || selected.name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {selected.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{selected.email}</div>
                    {selected.company && <div className="text-sm text-gray-500">{selected.name}</div>}
                    <div className="text-xs text-gray-400 mt-1">
                      Member since {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      {' · '}{selected.subscription_plan} plan
                    </div>
                    {!selected.is_active && (
                      <div className="text-xs text-red-500 mt-1 font-medium">
                        This account is deactivated — employer cannot log in
                      </div>
                    )}
                  </div>
                  {selected.is_active && (
                    <button onClick={() => setShowNewRequest(o => !o)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                      + Place Referral
                    </button>
                  )}
                </div>

                {showNewRequest && (
                  <div className="bg-white rounded-2xl border border-indigo-200 p-6">
                    <h3 className="font-semibold mb-4 text-gray-800">New Referral on behalf of {selected.name}</h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Candidate name" required value={form.candidateName}
                          onChange={e => setForm({ ...form, candidateName: e.target.value })}
                          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <input type="email" placeholder="Candidate email" value={form.candidateEmail}
                          onChange={e => setForm({ ...form, candidateEmail: e.target.value })}
                          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                      </div>
                      <input type="text" placeholder="Target role" value={form.targetRole}
                        onChange={e => setForm({ ...form, targetRole: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Referrers</span>
                          <button type="button" onClick={addReferrer} className="text-sm text-indigo-600">+ Add</button>
                        </div>
                        {form.referrers.map((r, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <input type="text" placeholder="Name" required value={r.name}
                              onChange={e => updateReferrer(i, 'name', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            <input type="email" placeholder="Email" required value={r.email}
                              onChange={e => updateReferrer(i, 'email', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                            {form.referrers.length > 1 && (
                              <button type="button" onClick={() => removeReferrer(i)}
                                className="text-gray-400 hover:text-red-500 px-2">✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                          Submit
                        </button>
                        <button type="button" onClick={() => setShowNewRequest(false)}
                          className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 text-sm font-semibold text-gray-700">
                    Active Pipeline ({pipeline.length})
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Candidate', 'Role', 'Refs', 'Status', ''].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pipeline.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm font-medium">{c.candidate_name}</td>
                          <td className="px-5 py-3 text-xs text-gray-500">{c.target_role || '—'}</td>
                          <td className="px-5 py-3 text-xs text-gray-600">{c.completed_referrers}/{c.total_referrers}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <Link to={`/references/${c.id}`}
                              className="text-xs text-indigo-600 hover:underline">View</Link>
                          </td>
                        </tr>
                      ))}
                      {pipeline.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No active candidates</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 flex items-center justify-center h-64 text-gray-400">
                Select an employer to view their pipeline
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
