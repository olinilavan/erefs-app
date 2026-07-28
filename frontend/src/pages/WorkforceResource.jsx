import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import EmployerNav from '../components/EmployerNav';

const STATUS_STYLE = {
  bench:       'bg-blue-100 text-blue-700',
  placed:      'bg-green-100 text-green-700',
  ending_soon: 'bg-amber-100 text-amber-700',
  on_leave:    'bg-yellow-100 text-yellow-700',
  inactive:    'bg-gray-100 text-gray-400',
};
const STATUS_LABEL = {
  bench:       'On Bench',
  placed:      'Placed',
  ending_soon: 'Ending Soon',
  on_leave:    'On Leave',
  inactive:    'Inactive',
};
const EMP_TYPES = [
  ['employee',      'Employee'],
  ['w2_contractor', 'W2 Contractor'],
  ['c2c_contractor','C2C Contractor'],
  ['intern',        'Intern'],
];
const MANUAL_STATUSES = ['bench', 'on_leave', 'inactive'];

function SkillTags({ skills }) {
  if (!skills) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
      ))}
    </div>
  );
}

function EditResourceForm({ resource, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name:           resource.name            || '',
    email:          resource.email           || '',
    phone:          resource.phone           || '',
    jobTitle:       resource.job_title       || '',
    skills:         resource.skills          || '',
    location:       resource.location        || '',
    employmentType: resource.employment_type || 'employee',
    status:         ['on_leave','inactive'].includes(resource.status) ? resource.status : 'bench',
    notes:          resource.notes           || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const r = await api.put(`/api/employer/workforce/${resource.id}`, form);
      onSaved(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Full name *</label>
          <input required value={form.name} onChange={f('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input type="email" value={form.email} onChange={f('email')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Job title</label>
          <input value={form.jobTitle} onChange={f('jobTitle')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Phone</label>
          <input value={form.phone} onChange={f('phone')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Skills (comma-separated)</label>
        <input value={form.skills} onChange={f('skills')} placeholder="e.g. React, Node.js, AWS, PostgreSQL"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Location</label>
          <input value={form.location} onChange={f('location')} placeholder="e.g. Austin, TX"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Employment type</label>
          <select value={form.employmentType} onChange={f('employmentType')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            {EMP_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status override</label>
          <select value={form.status} onChange={f('status')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            {MANUAL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={f('notes')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving}
          className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

function PlacementForm({ resourceId, onSaved, onCancel }) {
  const [form, setForm] = useState({
    clientName: '', projectName: '', startDate: '', endDate: '',
    billRate: '', payRate: '', rateType: 'hourly', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [showRates, setShowRates] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const r = await api.post(`/api/employer/workforce/${resourceId}/placements`, form);
      onSaved(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Client name *</label>
          <input required value={form.clientName} onChange={f('clientName')} placeholder="e.g. Accenture"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Project name</label>
          <input value={form.projectName} onChange={f('projectName')} placeholder="e.g. Data Platform Migration"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start date *</label>
          <input required type="date" value={form.startDate} onChange={f('startDate')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Release / end date</label>
          <input type="date" value={form.endDate} onChange={f('endDate')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
      </div>
      <button type="button" onClick={() => setShowRates(p => !p)}
        className="text-xs text-teal-600 hover:underline font-medium">
        {showRates ? '▲ Hide rates' : '▼ Add bill / pay rates (optional)'}
      </button>
      {showRates && (
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bill rate</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={form.billRate} onChange={f('billRate')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pay rate</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={form.payRate} onChange={f('payRate')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rate type</label>
            <select value={form.rateType} onChange={f('rateType')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              {[['hourly','Hourly'],['daily','Daily'],['monthly','Monthly']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={f('notes')} placeholder="Contract terms, extensions, etc."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving}
          className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Placement'}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ExtendForm({ placement, resourceId, onSaved, onCancel }) {
  const [endDate, setEndDate] = useState(placement.end_date ? placement.end_date.split('T')[0] : '');
  const [notes, setNotes]     = useState(placement.notes || '');
  const [saving, setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.patch(`/api/employer/workforce/${resourceId}/placements/${placement.id}`, { endDate, notes });
      onSaved(r.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">New release date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Extension reason, etc."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="text-xs bg-teal-600 text-white px-4 py-1.5 rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-xs border border-gray-300 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function WorkforceResource() {
  const { id } = useParams();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingPlacement, setAddingPlacement] = useState(false);
  const [extending, setExtending] = useState(false);
  const [ending, setEnding]   = useState(false);

  useEffect(() => {
    api.get(`/api/employer/workforce/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError(true));
  }, [id]);

  if (error) return (
    <div className="min-h-screen bg-gray-50"><EmployerNav />
      <div className="text-center py-20 text-gray-400">Resource not found.</div>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen bg-gray-50"><EmployerNav />
      <div className="text-center py-20 text-gray-400">Loading…</div>
    </div>
  );

  const { resource, placements, activePlacement } = data;

  async function endPlacement() {
    if (!window.confirm('Mark this placement as ended? The resource will return to bench.')) return;
    setEnding(true);
    try {
      await api.patch(`/api/employer/workforce/${id}/placements/${activePlacement.id}`, { status: 'ended' });
      const r = await api.get(`/api/employer/workforce/${id}`);
      setData(r.data);
    } finally {
      setEnding(false);
    }
  }

  const endDate  = activePlacement?.end_date;
  const daysLeft = endDate ? Math.ceil((new Date(endDate) - new Date()) / 86400000) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNav />
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
        <Link to="/employer/workforce" className="text-sm text-teal-600 hover:underline">← Workforce</Link>

        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-3 mt-3 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{resource.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[resource.computed_status]}`}>
                {STATUS_LABEL[resource.computed_status]}
              </span>
            </div>
            {resource.job_title && <p className="text-sm text-gray-500 mt-0.5">{resource.job_title}</p>}
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Edit Resource</h2>
            <EditResourceForm
              resource={resource}
              onSaved={updated => { setData(d => ({ ...d, resource: updated })); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-xs text-gray-400 block mb-0.5">Email</span>{resource.email || '—'}</div>
              <div><span className="text-xs text-gray-400 block mb-0.5">Phone</span>{resource.phone || '—'}</div>
              <div><span className="text-xs text-gray-400 block mb-0.5">Location</span>{resource.location || '—'}</div>
              <div><span className="text-xs text-gray-400 block mb-0.5">Type</span>
                {EMP_TYPES.find(([v]) => v === resource.employment_type)?.[1] || resource.employment_type || '—'}
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-gray-400 block mb-1">Skills</span>
                <SkillTags skills={resource.skills} />
              </div>
              {resource.notes && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-gray-400 block mb-0.5">Notes</span>
                  <p className="text-gray-600">{resource.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Placement */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Current Placement</h2>
            {!activePlacement && !addingPlacement && (
              <button onClick={() => setAddingPlacement(true)}
                className="text-sm bg-teal-600 text-white px-4 py-1.5 rounded-lg hover:bg-teal-700 transition">
                + Add Placement
              </button>
            )}
          </div>

          {addingPlacement ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <PlacementForm
                resourceId={id}
                onSaved={async () => {
                  const r = await api.get(`/api/employer/workforce/${id}`);
                  setData(r.data); setAddingPlacement(false);
                }}
                onCancel={() => setAddingPlacement(false)}
              />
            </div>
          ) : !activePlacement ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-gray-400 text-sm">
              No active placement — resource is on bench.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-gray-800">{activePlacement.client_name}</p>
                  {activePlacement.project_name && (
                    <p className="text-sm text-gray-500">{activePlacement.project_name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExtending(p => !p)}
                    className="text-xs text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition font-medium">
                    Extend / Update
                  </button>
                  <button onClick={endPlacement} disabled={ending}
                    className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50">
                    {ending ? 'Ending…' : 'End Placement'}
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Start date</span>
                  {new Date(activePlacement.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Release date</span>
                  {endDate ? (
                    <span className={daysLeft !== null && daysLeft <= 30 ? 'text-amber-600 font-semibold' : ''}>
                      {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {daysLeft !== null && ` · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                    </span>
                  ) : '—  (open-ended)'}
                </div>
                {(activePlacement.bill_rate || activePlacement.pay_rate) && (
                  <>
                    {activePlacement.bill_rate && (
                      <div>
                        <span className="text-xs text-gray-400 block mb-0.5">Bill rate</span>
                        ${Number(activePlacement.bill_rate).toFixed(2)} / {activePlacement.rate_type}
                      </div>
                    )}
                    {activePlacement.pay_rate && (
                      <div>
                        <span className="text-xs text-gray-400 block mb-0.5">Pay rate</span>
                        ${Number(activePlacement.pay_rate).toFixed(2)} / {activePlacement.rate_type}
                      </div>
                    )}
                  </>
                )}
              </div>
              {activePlacement.notes && (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{activePlacement.notes}</p>
              )}
              {extending && (
                <ExtendForm
                  placement={activePlacement}
                  resourceId={id}
                  onSaved={async () => { const r = await api.get(`/api/employer/workforce/${id}`); setData(r.data); setExtending(false); }}
                  onCancel={() => setExtending(false)}
                />
              )}
            </div>
          )}
        </section>

        {/* Placement history */}
        {placements.filter(p => p.status !== 'active').length > 0 && (
          <section>
            <h2 className="font-semibold text-gray-800 mb-3">Placement History</h2>
            <div className="space-y-2">
              {placements.filter(p => p.status !== 'active').map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 px-5 py-3 text-sm">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <span className="font-medium text-gray-700">{p.client_name}</span>
                      {p.project_name && <span className="text-gray-400"> · {p.project_name}</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {p.end_date && ` → ${new Date(p.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </div>
                  </div>
                  {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
