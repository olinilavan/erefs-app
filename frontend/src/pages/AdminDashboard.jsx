import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { state: navState } = useLocation();
  const [stats, setStats] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', targetRole: '', referrers: [{ name: '', email: '' }] });
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSummary, setDeleteSummary] = useState(null);
  const [deleteSummaryLoading, setDeleteSummaryLoading] = useState(false);
  const [flashRequests, setFlashRequests] = useState([]);

  function loadFlashRequests() {
    api.get('/api/admin/flash-requests').then(r => setFlashRequests(r.data));
  }

  useEffect(() => {
    api.get('/api/admin/stats').then(r => setStats(r.data));
    api.get('/api/admin/employers').then(r => {
      setEmployers(r.data);
      if (navState?.employerId) {
        const emp = r.data.find(e => e.id === navState.employerId);
        if (emp) selectEmployer(emp);
      }
    });
    loadFlashRequests();
  }, []);

  async function activateFlash(id) {
    await api.patch(`/api/admin/flash-requests/${id}/activate`);
    loadFlashRequests();
  }

  async function declineFlash(id) {
    await api.patch(`/api/admin/flash-requests/${id}/decline`);
    loadFlashRequests();
  }

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

  async function openDeleteModal(id) {
    setDeleteTarget(id);
    setDeleteSummary(null);
    setDeleteSummaryLoading(true);
    try {
      const r = await api.get(`/api/admin/employers/${id}/data-summary`);
      setDeleteSummary(r.data);
    } finally {
      setDeleteSummaryLoading(false);
    }
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteSummary(null);
  }

  async function confirmDelete() {
    try {
      await api.delete(`/api/admin/employers/${deleteTarget}`);
      closeDeleteModal();
      setSelected(null);
      setPipeline([]);
      const res = await api.get('/api/admin/employers');
      setEmployers(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed — please try again.');
    }
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
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-4">
            <p className="text-gray-800 font-semibold text-base mb-1">Permanently delete this account?</p>

            {deleteSummaryLoading && (
              <p className="text-sm text-gray-400 my-4">Checking records…</p>
            )}

            {!deleteSummaryLoading && deleteSummary && (() => {
              const hasData = deleteSummary.jobs > 0 || deleteSummary.bgChecks > 0 ||
                deleteSummary.workforce > 0 || deleteSummary.candidates > 0 ||
                deleteSummary.vendorSubmissions > 0 || deleteSummary.vendorLinks > 0;

              return hasData ? (
                <div className="my-4">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    ⚠️ This account has existing records. All of the following will be permanently wiped:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {deleteSummary.jobs > 0            && <li>📋 <strong>{deleteSummary.jobs}</strong> job posting{deleteSummary.jobs !== 1 ? 's' : ''} (and all applicants)</li>}
                    {deleteSummary.bgChecks > 0        && <li>🔍 <strong>{deleteSummary.bgChecks}</strong> background check{deleteSummary.bgChecks !== 1 ? 's' : ''} (and all entries)</li>}
                    {deleteSummary.workforce > 0       && <li>👤 <strong>{deleteSummary.workforce}</strong> workforce resource{deleteSummary.workforce !== 1 ? 's' : ''} (and placements)</li>}
                    {deleteSummary.candidates > 0      && <li>📝 <strong>{deleteSummary.candidates}</strong> reference request{deleteSummary.candidates !== 1 ? 's' : ''} (and all referrer responses)</li>}
                    {deleteSummary.vendorSubmissions > 0 && <li>📤 <strong>{deleteSummary.vendorSubmissions}</strong> vendor candidate submission{deleteSummary.vendorSubmissions !== 1 ? 's' : ''}</li>}
                    {deleteSummary.vendorLinks > 0     && <li>🔗 <strong>{deleteSummary.vendorLinks}</strong> vendor network link{deleteSummary.vendorLinks !== 1 ? 's' : ''}</li>}
                  </ul>
                  <p className="text-xs text-gray-400 mt-2">This action cannot be undone.</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 my-4">
                  No job postings, background checks, workforce records, or other data found. Safe to delete.
                </p>
              );
            })()}

            <div className="flex gap-3 justify-end mt-2">
              <button onClick={closeDeleteModal}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleteSummaryLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-teal-900 text-white px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-xl font-bold tracking-tight">Vouch<span className="font-normal">Metrics</span></Link>
          <span className="text-xs bg-teal-700 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <button onClick={logout} className="text-sm text-teal-300 hover:text-white transition">Logout</button>
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
                <div className="text-2xl font-bold text-teal-700">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Flash Job payment queue */}
        {flashRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-orange-200 mb-8 overflow-hidden">
            <div className="px-5 py-4 border-b border-orange-100 bg-orange-50">
              <h2 className="font-semibold text-gray-800">🔥 Flash Job Requests — Pending Payment</h2>
              <p className="text-xs text-gray-500 mt-0.5">Confirm payment was received externally, then activate.</p>
            </div>
            <div className="divide-y divide-gray-50">
              {flashRequests.map(fr => (
                <div key={fr.id} className="px-5 py-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{fr.title}</div>
                    <div className="text-xs text-gray-400">
                      {fr.company || fr.employer_name} · {fr.employer_email}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Requested {new Date(fr.flash_requested_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => declineFlash(fr.id)}
                      className="text-xs text-gray-500 hover:text-red-600 font-medium transition">
                      Decline
                    </button>
                    <button onClick={() => activateFlash(fr.id)}
                      className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 font-medium transition">
                      Payment Received — Activate
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {filtered.map(emp => (
                <div key={emp.id}
                  className={`w-full px-5 py-4 border-b border-gray-50 ${selected?.id === emp.id ? 'bg-teal-50 border-l-2 border-teal-500' : emp.is_active ? '' : 'bg-gray-50 opacity-60'}`}>
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
                          className="text-xs text-teal-600 hover:text-teal-800 font-medium transition">
                          Restore
                        </button>
                        <button onClick={() => openDeleteModal(emp.id)}
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
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
                      + Place Referral
                    </button>
                  )}
                </div>

                {showNewRequest && (
                  <div className="bg-white rounded-2xl border border-teal-200 p-6">
                    <h3 className="font-semibold mb-4 text-gray-800">New Referral on behalf of {selected.name}</h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Candidate name" required value={form.candidateName}
                          onChange={e => setForm({ ...form, candidateName: e.target.value })}
                          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                        <input type="email" placeholder="Candidate email" value={form.candidateEmail}
                          onChange={e => setForm({ ...form, candidateEmail: e.target.value })}
                          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                      </div>
                      <input type="text" placeholder="Target role" value={form.targetRole}
                        onChange={e => setForm({ ...form, targetRole: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Referrers</span>
                          <button type="button" onClick={addReferrer} className="text-sm text-teal-600">+ Add</button>
                        </div>
                        {form.referrers.map((r, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <input type="text" placeholder="Name" required value={r.name}
                              onChange={e => updateReferrer(i, 'name', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            <input type="email" placeholder="Email" required value={r.email}
                              onChange={e => updateReferrer(i, 'email', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                            {form.referrers.length > 1 && (
                              <button type="button" onClick={() => removeReferrer(i)}
                                className="text-gray-400 hover:text-red-500 px-2">✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
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
                              className="text-xs text-teal-600 hover:underline">View</Link>
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
