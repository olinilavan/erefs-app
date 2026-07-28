import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import EmployerNav from '../components/EmployerNav';

const STATUS_STYLE = {
  invited:     'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted:   'bg-teal-100 text-teal-700',
  verifying:   'bg-purple-100 text-purple-700',
  completed:   'bg-green-100 text-green-700',
  declined:    'bg-red-100 text-red-600',
  expired:     'bg-gray-100 text-gray-500',
};

const STATUS_LABEL = {
  invited:     'Invited',
  in_progress: 'In Progress',
  submitted:   'Submitted',
  verifying:   'Verifying',
  completed:   'Completed',
  declined:    'Declined',
  expired:     'Expired',
};

const CHECK_ICONS = { reference: '📋', education: '🎓', criminal: '🔍' };

function InitiateForm({ onSubmitted, onCancel }) {
  const [form, setForm] = useState({
    candidateName: '', candidateEmail: '', targetRole: '',
    includeReference: true, includeEducation: false, includeCriminal: false,
    deadlineDays: 7,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.includeReference && !form.includeEducation && !form.includeCriminal) {
      setError('Select at least one check type');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/api/employer/bg-checks', form);
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
      <h2 className="font-semibold mb-5">Initiate Background Check</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="grid md:grid-cols-2 gap-4">
          <input type="text" placeholder="Candidate name *" required value={form.candidateName}
            onChange={e => setForm({ ...form, candidateName: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input type="email" placeholder="Candidate email *" required value={form.candidateEmail}
            onChange={e => setForm({ ...form, candidateEmail: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <input type="text" placeholder="Role (e.g. Senior Engineer)" value={form.targetRole}
          onChange={e => setForm({ ...form, targetRole: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Checks to run *</p>
          <div className="flex flex-wrap gap-3">
            {[
              ['includeReference', '📋 Reference Check'],
              ['includeEducation', '🎓 Education Verification'],
              ['includeCriminal',  '🔍 Criminal Check'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.checked })}
                  className="accent-teal-600 w-4 h-4" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 whitespace-nowrap">Candidate deadline</label>
          <input type="number" min={1} max={90} value={form.deadlineDays}
            onChange={e => setForm({ ...form, deadlineDays: parseInt(e.target.value) || 7 })}
            className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <span className="text-sm text-gray-500">days</span>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50">
            {saving ? 'Sending…' : 'Send Invite'}
          </button>
          <button type="button" onClick={onCancel}
            className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EmployerDashboard() {
  const [checks, setChecks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState('active');

  function load() {
    api.get('/api/employer/bg-checks').then(r => {
      setChecks(r.data);
      setLoaded(true);
    });
  }

  useEffect(() => { load(); }, []);

  const activeStatuses = ['invited', 'in_progress', 'submitted', 'verifying'];
  const doneStatuses   = ['completed', 'declined', 'expired'];
  const visible = checks.filter(c => tab === 'active' ? activeStatuses.includes(c.status) : doneStatuses.includes(c.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNav />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Hiring</h1>
            <p className="text-gray-500 text-sm mt-1">Initiate and track background checks for your candidates</p>
          </div>
          {!showNew && (
            <button onClick={() => setShowNew(true)}
              className="bg-teal-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-teal-700 transition">
              + Initiate Background Check
            </button>
          )}
        </div>

        {showNew && (
          <InitiateForm
            onSubmitted={() => { setShowNew(false); load(); }}
            onCancel={() => setShowNew(false)}
          />
        )}

        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
          {[['active', 'Active'], ['done', 'Completed / Closed']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Candidate', 'Role', 'Checks', 'Status', 'Deadline', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loaded ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    {tab === 'active' ? 'No active background checks' : 'None yet'}
                  </td>
                </tr>
              ) : visible.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{c.candidate_name}</div>
                    <div className="text-xs text-gray-400">{c.candidate_email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.target_role || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {c.include_reference && <span title="Reference Check" className="text-base">{CHECK_ICONS.reference}</span>}
                      {c.include_education && <span title="Education Verification" className="text-base">{CHECK_ICONS.education}</span>}
                      {c.include_criminal  && <span title="Criminal Check" className="text-base">{CHECK_ICONS.criminal}</span>}
                    </div>
                    {c.include_reference && (
                      <div className="text-xs text-gray-400 mt-0.5">{c.ref_completed}/{c.ref_total} refs</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[c.status] || 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/employer/bg-checks/${c.id}`}
                      className="text-sm text-teal-600 hover:underline font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}
