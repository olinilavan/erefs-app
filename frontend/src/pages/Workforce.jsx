import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import EmployerNav from '../components/EmployerNav';

const STATUS_STYLE = {
  bench:        'bg-blue-100 text-blue-700',
  placed:       'bg-green-100 text-green-700',
  ending_soon:  'bg-amber-100 text-amber-700',
  on_leave:     'bg-yellow-100 text-yellow-700',
  inactive:     'bg-gray-100 text-gray-400',
};
const STATUS_LABEL = {
  bench:        'On Bench',
  placed:       'Placed',
  ending_soon:  'Ending Soon',
  on_leave:     'On Leave',
  inactive:     'Inactive',
};

const EMP_TYPES = [
  ['employee',      'Employee'],
  ['w2_contractor', 'W2 Contractor'],
  ['c2c_contractor','C2C Contractor'],
  ['intern',        'Intern'],
];

const BENCH_WINDOWS = [14, 30, 60, 90];

function SkillTags({ skills }) {
  if (!skills) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
      ))}
    </div>
  );
}

function AddResourceForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', jobTitle: '', skills: '',
    location: '', employmentType: 'employee', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const r = await api.post('/api/employer/workforce', form);
      onSaved(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <h2 className="font-semibold text-gray-800 mb-4">Add Resource</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Full name *" value={form.name} onChange={f('name')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <input type="email" placeholder="Email" value={form.email} onChange={f('email')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Job title" value={form.jobTitle} onChange={f('jobTitle')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <input placeholder="Phone" value={form.phone} onChange={f('phone')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <input placeholder="Skills (comma-separated, e.g. React, Node.js, AWS)" value={form.skills} onChange={f('skills')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <div className="grid sm:grid-cols-2 gap-3">
          <input placeholder="Location (e.g. Austin, TX)" value={form.location} onChange={f('location')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <select value={form.employmentType} onChange={f('employmentType')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            {EMP_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <textarea rows={2} placeholder="Notes (optional)" value={form.notes} onChange={f('notes')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Resource'}
          </button>
          <button type="button" onClick={onCancel}
            className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ResourceCard({ resource, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Remove ${resource.name} from your workforce?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/api/employer/workforce/${resource.id}`);
      onDeleted(resource.id);
    } catch {
      setDeleting(false);
    }
  }

  const endDate = resource.placement?.endDate;
  const daysLeft = endDate
    ? Math.ceil((new Date(endDate) - new Date()) / 86400000)
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/employer/workforce/${resource.id}`}
            className="font-semibold text-gray-800 hover:text-teal-600 transition">
            {resource.name}
          </Link>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[resource.computed_status]}`}>
            {STATUS_LABEL[resource.computed_status]}
          </span>
        </div>
        {resource.job_title && <p className="text-sm text-gray-500 mt-0.5">{resource.job_title}</p>}
        <SkillTags skills={resource.skills} />
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-400">
          {resource.location  && <span>📍 {resource.location}</span>}
          {resource.employment_type && <span>· {EMP_TYPES.find(([v]) => v === resource.employment_type)?.[1] || resource.employment_type}</span>}
        </div>
        {resource.placement && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{resource.placement.clientName}</span>
            {resource.placement.projectName && ` · ${resource.placement.projectName}`}
            {endDate && (
              <span className={`ml-2 font-medium ${daysLeft !== null && daysLeft <= 30 ? 'text-amber-600' : 'text-gray-500'}`}>
                · Releases {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {daysLeft !== null && daysLeft >= 0 && ` (${daysLeft}d)`}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link to={`/employer/workforce/${resource.id}`}
          className="text-sm text-teal-600 hover:underline font-medium">
          Manage →
        </Link>
        <button onClick={handleDelete} disabled={deleting}
          className="text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-30">
          Remove
        </button>
      </div>
    </div>
  );
}

function MyTeamTab() {
  const [resources, setResources] = useState([]);
  const [loaded, setLoaded]       = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    api.get('/api/employer/workforce').then(r => { setResources(r.data); setLoaded(true); });
  }, []);

  const filtered = filter === 'all' ? resources : resources.filter(r => r.computed_status === filter);

  const counts = {
    all:          resources.length,
    placed:       resources.filter(r => r.computed_status === 'placed').length,
    ending_soon:  resources.filter(r => r.computed_status === 'ending_soon').length,
    bench:        resources.filter(r => r.computed_status === 'bench').length,
    on_leave:     resources.filter(r => r.computed_status === 'on_leave').length,
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
          {[['all', 'All'], ['placed', 'Placed'], ['ending_soon', 'Ending Soon'], ['bench', 'On Bench'], ['on_leave', 'On Leave']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${filter === k ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {l} {counts[k] > 0 && <span className="ml-1 opacity-60">{counts[k]}</span>}
            </button>
          ))}
        </div>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
            + Add Resource
          </button>
        )}
      </div>

      {showAdd && (
        <AddResourceForm
          onSaved={r => { setResources(p => [r, ...p]); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {!loaded ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {resources.length === 0
            ? <><div className="text-4xl mb-3">👥</div><p>No resources yet — add your first one above.</p></>
            : <p>No resources match this filter.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ResourceCard key={r.id} resource={r}
              onDeleted={id => setResources(p => p.filter(x => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}

function BenchReportTab() {
  const [days, setDays]       = useState(30);
  const [resources, setRes]   = useState([]);
  const [loaded, setLoaded]   = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoaded(false);
    api.get(`/api/employer/workforce/bench?days=${days}`)
      .then(r => { setRes(r.data); setLoaded(true); });
  }, [days]);

  async function sendEmail() {
    setSending(true); setSent(false); setError('');
    try {
      await api.post('/api/employer/workforce/bench/email', { days });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch {
      setError('Failed to send — please try again.');
    } finally {
      setSending(false);
    }
  }

  const onBench    = resources.filter(r => r.computed_status === 'bench');
  const endingSoon = resources.filter(r => r.computed_status === 'ending_soon');

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ending within</span>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {BENCH_WINDOWS.map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${days === d ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sent && <span className="text-sm text-green-600 font-medium">✓ Report sent!</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
          <button onClick={sendEmail} disabled={sending || resources.length === 0}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50">
            {sending ? 'Sending…' : '✉ Send Report Email'}
          </button>
        </div>
      </div>

      {!loaded ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <p>No resources on bench or releasing within {days} days.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {onBench.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">
                Available Now — On Bench ({onBench.length})
              </h3>
              <div className="space-y-3">
                {onBench.map(r => <BenchCard key={r.id} resource={r} />)}
              </div>
            </section>
          )}
          {endingSoon.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
                Ending Within {days} Days ({endingSoon.length})
              </h3>
              <div className="space-y-3">
                {endingSoon.map(r => <BenchCard key={r.id} resource={r} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BenchCard({ resource }) {
  const endDate  = resource.placement?.endDate;
  const daysLeft = endDate ? Math.ceil((new Date(endDate) - new Date()) / 86400000) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/employer/workforce/${resource.id}`}
            className="font-semibold text-gray-800 hover:text-teal-600 transition">
            {resource.name}
          </Link>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[resource.computed_status]}`}>
            {STATUS_LABEL[resource.computed_status]}
          </span>
        </div>
        {resource.job_title && <p className="text-sm text-gray-500 mt-0.5">{resource.job_title}</p>}
        <SkillTags skills={resource.skills} />
        {resource.location && <p className="text-xs text-gray-400 mt-1">📍 {resource.location}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        {resource.placement ? (
          <>
            <p className="text-sm font-medium text-gray-700">{resource.placement.clientName}</p>
            {endDate && (
              <p className={`text-xs font-semibold mt-0.5 ${daysLeft !== null && daysLeft <= 14 ? 'text-red-600' : 'text-amber-600'}`}>
                Releases {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {daysLeft !== null && ` · ${daysLeft}d`}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm font-semibold text-green-600">Available now</p>
        )}
        <Link to={`/employer/workforce/${resource.id}`}
          className="text-xs text-teal-600 hover:underline font-medium mt-1 block">
          View →
        </Link>
      </div>
    </div>
  );
}

export default function Workforce() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'team';

  function setTab(t) { setSearchParams({ tab: t }); }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNav />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Workforce</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your internal resources and track client engagements</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {[['team', '👥 My Team'], ['bench', '📊 Bench Report']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === k ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'team' ? <MyTeamTab /> : <BenchReportTab />}
      </main>
    </div>
  );
}
