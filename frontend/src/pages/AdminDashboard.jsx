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
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [releaseForm, setReleaseForm] = useState({ version: '', title: '', description: '' });
  const [sendingRelease, setSendingRelease] = useState(false);
  const [releaseError, setReleaseError] = useState('');
  const [releaseSent, setReleaseSent] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [enquiryFilter, setEnquiryFilter] = useState('all');
  const [patchingEnquiry, setPatchingEnquiry] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [openChatSession, setOpenChatSession] = useState(null);
  const [chatThread, setChatThread] = useState(null);
  const [vendorRequests, setVendorRequests] = useState([]);

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
    api.get('/api/admin/release-notes').then(r => setReleaseNotes(r.data));
    api.get('/api/demo/enquiries').then(r => setEnquiries(r.data));
    api.get('/api/chat/sessions').then(r => setChatSessions(r.data));
    api.get('/api/admin/vendor-requests').then(r => setVendorRequests(r.data));
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

  async function openChat(id) {
    if (openChatSession === id) { setOpenChatSession(null); setChatThread(null); return; }
    setOpenChatSession(id);
    setChatThread(null);
    const r = await api.get(`/api/chat/sessions/${id}`);
    setChatThread(r.data);
  }

  async function patchEnquiry(id, patch) {
    setPatchingEnquiry(id);
    try {
      const r = await api.patch(`/api/demo/enquiries/${id}`, patch);
      setEnquiries(prev => prev.map(e => e.id === id ? r.data : e));
    } finally {
      setPatchingEnquiry(null);
    }
  }

  async function sendRelease(e) {
    e.preventDefault();
    setReleaseError(''); setSendingRelease(true);
    try {
      const r = await api.post('/api/admin/release-notes', releaseForm);
      setReleaseSent(r.data);
      setReleaseNotes(prev => [r.data, ...prev]);
      setReleaseForm({ version: '', title: '', description: '' });
    } catch (err) {
      setReleaseError(err.response?.data?.error || 'Failed to send — please try again.');
    } finally {
      setSendingRelease(false);
    }
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
        {/* Pending Vendor Requests */}
        {vendorRequests.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-yellow-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-yellow-100 bg-yellow-50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">Pending Vendor Requests</h2>
                <p className="text-xs text-gray-400 mt-0.5">{vendorRequests.length} request{vendorRequests.length !== 1 ? 's' : ''} awaiting buyer action</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {vendorRequests.map(r => (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-800">{r.vendor_company || r.vendor_name}</span>
                        <span className="text-gray-400 text-xs">→</span>
                        <span className="text-sm text-gray-600">{r.buyer_company || r.buyer_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">pending</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {r.vendor_email} · Requested {new Date(r.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {r.vendor_bio && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.vendor_bio}</p>
                      )}
                      {(r.vendor_specializations?.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {r.vendor_specializations.map(s => (
                            <span key={s} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                      {(r.vendor_states?.length > 0) && (
                        <p className="text-xs text-gray-400 mt-1">{r.vendor_states.join(', ')}</p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete the pending request from ${r.vendor_company || r.vendor_name}? This cannot be undone.`)) return;
                        await api.delete(`/api/admin/vendor-requests/${r.id}`);
                        setVendorRequests(prev => prev.filter(x => x.id !== r.id));
                      }}
                      className="shrink-0 text-xs text-red-500 hover:text-red-700 font-medium border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-lg transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo Enquiries */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Demo &amp; Business Enquiries</h2>
              <p className="text-xs text-gray-400 mt-0.5">Submissions from the public /demo page</p>
            </div>
            <div className="flex gap-1">
              {['all', 'new', 'contacted', 'converted', 'closed'].map(f => (
                <button key={f} onClick={() => setEnquiryFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${enquiryFilter === f ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {enquiries.filter(e => enquiryFilter === 'all' || e.status === enquiryFilter).length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No enquiries yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {enquiries
                .filter(e => enquiryFilter === 'all' || e.status === enquiryFilter)
                .map(enq => (
                  <div key={enq.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-800">{enq.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            enq.enquiry_type === 'demo' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                          }`}>{enq.enquiry_type === 'demo' ? 'Book a Demo' : 'Business Enquiry'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            enq.status === 'new' ? 'bg-yellow-100 text-yellow-700'
                            : enq.status === 'contacted' ? 'bg-blue-100 text-blue-700'
                            : enq.status === 'converted' ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                          }`}>{enq.status}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {enq.email}{enq.company ? ` · ${enq.company}` : ''}{enq.job_title ? ` · ${enq.job_title}` : ''}{enq.team_size ? ` · ${enq.team_size} people` : ''}
                        </div>
                        {enq.message && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{enq.message}</p>
                        )}
                        {enq.admin_notes && (
                          <p className="text-xs text-indigo-600 mt-1">Notes: {enq.admin_notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{new Date(enq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <select
                          defaultValue={enq.status}
                          disabled={patchingEnquiry === enq.id}
                          onChange={e => patchEnquiry(enq.id, { status: e.target.value })}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        >
                          {['new', 'contacted', 'converted', 'closed'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Add note…"
                          defaultValue={enq.admin_notes || ''}
                          onBlur={e => {
                            if (e.target.value !== (enq.admin_notes || ''))
                              patchEnquiry(enq.id, { adminNotes: e.target.value });
                          }}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-36 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Release Notes */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* Compose form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Send Release Note</h2>
            {releaseSent && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                Sent to <strong>{releaseSent.sent_to}</strong> employer{releaseSent.sent_to !== 1 ? 's' : ''}.
                <button onClick={() => setReleaseSent(null)} className="ml-2 underline text-green-600">Dismiss</button>
              </div>
            )}
            {releaseError && (
              <p className="mb-3 text-sm text-red-500">{releaseError}</p>
            )}
            <form onSubmit={sendRelease} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Version *</label>
                  <input required value={releaseForm.version}
                    onChange={e => setReleaseForm(f => ({ ...f, version: e.target.value }))}
                    placeholder="e.g. v1.5.0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Title *</label>
                  <input required value={releaseForm.title}
                    onChange={e => setReleaseForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Employment Verification"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description *</label>
                <textarea required rows={5} value={releaseForm.description}
                  onChange={e => setReleaseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={"• Employment verification check added to background checks\n• Vendors now receive job alerts for vendor-only postings\n• Bug fixes and performance improvements"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <button type="submit" disabled={sendingRelease}
                className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition">
                {sendingRelease ? 'Sending…' : 'Send to All Employers'}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 text-sm font-semibold text-gray-700">
              Release History
            </div>
            {releaseNotes.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">No releases sent yet</div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                {releaseNotes.map(n => (
                  <div key={n.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{n.version}</span>
                      <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line line-clamp-2">{n.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Sent to {n.sent_to} employer{n.sent_to !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Chat Sessions */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Visitor Chat Sessions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Conversations from the public chatbot — {chatSessions.length} total</p>
          </div>

          {chatSessions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No chat sessions yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {chatSessions.map(s => (
                <div key={s.id}>
                  <button onClick={() => openChat(s.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition text-left">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400">{s.session_token.slice(0, 8)}…</span>
                        <span className="text-xs text-gray-500">{s.message_count} message{s.message_count !== 1 ? 's' : ''}</span>
                        {s.page_url && <span className="text-xs text-gray-400">{s.page_url}</span>}
                      </div>
                      {s.last_user_message && (
                        <p className="text-sm text-gray-600 mt-0.5 truncate">{s.last_user_message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Started {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}Last active {new Date(s.last_active_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-gray-400 text-xs ml-4 shrink-0">{openChatSession === s.id ? '▲' : '▼'}</span>
                  </button>

                  {openChatSession === s.id && (
                    <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                      {!chatThread ? (
                        <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
                      ) : (
                        <div className="space-y-2 pt-4 max-h-80 overflow-y-auto">
                          {chatThread.messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                m.role === 'user'
                                  ? 'bg-teal-600 text-white rounded-br-sm'
                                  : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                              }`}>
                                {m.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
