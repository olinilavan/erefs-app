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
      <nav className="bg-indigo-900 text-white px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">eRefs<span className="text-indigo-300">.ai</span></span>
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
                <button key={emp.id} onClick={() => selectEmployer(emp)}
                  className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition ${selected?.id === emp.id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}>
                  <div className="font-medium text-sm text-gray-800">{emp.name}</div>
                  <div className="text-xs text-gray-400 truncate">{emp.email}</div>
                  {emp.company && <div className="text-xs text-gray-500 mt-0.5">{emp.company}</div>}
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-xs text-gray-400">{emp.active_requests} active requests</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${emp.terms_accepted_at ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {emp.terms_accepted_at ? 'Terms accepted' : 'No terms'}
                    </span>
                  </div>
                </button>
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
                <div className="bg-white rounded-2xl border border-gray-200 p-5 flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-gray-800">{selected.name}</h2>
                    <div className="text-sm text-gray-400">{selected.email}</div>
                    {selected.company && <div className="text-sm text-gray-500">{selected.company}</div>}
                    <div className="text-xs text-gray-400 mt-1">
                      Member since {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      {' · '}{selected.subscription_plan} plan
                    </div>
                  </div>
                  <button onClick={() => setShowNewRequest(o => !o)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                    + Place Referral
                  </button>
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
