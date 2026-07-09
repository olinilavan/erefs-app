import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import AccountDropdown from '../components/AccountDropdown';
import Tooltip from '../components/Tooltip';

const WORK_REQUIREMENTS = ['US Citizen', 'Green Card', 'H1B Sponsorship Available', 'Any'];

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

function JobForm({ initial, defaultIsPublic, onSubmit, onCancel, submitLabel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [workRequirement, setWorkRequirement] = useState(initial?.work_requirement || '');
  const [isPublic, setIsPublic] = useState(initial ? !!initial.is_public : defaultIsPublic !== false);
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at ? initial.expires_at.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ title, description, location, workRequirement, isPublic, expiresAt: expiresAt || null });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <input type="text" placeholder="Job title" required value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
      <textarea rows={4} placeholder="Description" value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
      <div className="grid md:grid-cols-2 gap-4">
        <input type="text" placeholder="Location (e.g. Austin, TX or Remote)" value={location}
          onChange={e => setLocation(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <select value={workRequirement} onChange={e => setWorkRequirement(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">Work requirement...</option>
          {WORK_REQUIREMENTS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Posting expires</label>
        <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <p className="text-xs text-gray-400 mt-1">Optional — leave blank for no expiration. Expired postings are hidden from Open Roles automatically.</p>
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <label className="text-sm text-gray-600">Visibility</label>
          <Tooltip text="Open to Public appears on the public Open Roles page and can be boosted with Flash. Vendor Only is hidden from the public — only your approved vendors can see it and submit candidates.">
            <span className="text-gray-400 cursor-default text-xs leading-none">ⓘ</span>
          </Tooltip>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 max-w-xs">
          {[[true, 'Open to Public'], [false, 'Vendor Only']].map(([val, label]) => (
            <button key={label} type="button" onClick={() => setIsPublic(val)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${isPublic === val ? 'bg-white shadow text-teal-700' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {isPublic
            ? 'Shown on the public Open Roles page — anyone can apply.'
            : 'Hidden from Open Roles — only your approved vendors can see and submit candidates.'}
        </p>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50">
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

function JobCard({ job, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isExpired = job.expires_at && new Date(job.expires_at) < new Date();

  async function togglePublic() {
    await api.patch(`/api/employer/jobs/${job.id}`, { isPublic: !job.is_public });
    onUpdated();
  }

  async function toggleStatus() {
    await api.patch(`/api/employer/jobs/${job.id}`, { status: job.status === 'active' ? 'closed' : 'active' });
    onUpdated();
  }

  async function handleDelete() {
    await api.delete(`/api/employer/jobs/${job.id}`);
    setConfirmingDelete(false);
    onDeleted();
  }

  async function requestFlash() {
    await api.post(`/api/employer/jobs/${job.id}/flash`);
    onUpdated();
  }

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
        <h3 className="font-semibold mb-4">Edit Job Posting</h3>
        <JobForm
          initial={job}
          submitLabel="Save Changes"
          onSubmit={async data => {
            await api.patch(`/api/employer/jobs/${job.id}`, data);
            setEditing(false);
            onUpdated();
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {confirmingDelete && (
        <ConfirmModal
          message="This will permanently delete the job posting and all its applicants. This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-800">{job.title}</div>
            {job.flash_status === 'active' && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">🔥 Flash</span>
            )}
            {job.flash_status === 'pending_payment' && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Flash Pending</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {[job.location, job.work_requirement].filter(Boolean).join(' · ') || 'No location/requirement set'}
          </div>
          {job.expires_at && (
            <div className={`text-xs mt-0.5 ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
              {isExpired ? 'Expired' : 'Expires'} {new Date(job.expires_at).toLocaleDateString()}
            </div>
          )}
          {job.flash_status === 'active' && job.flash_expires_at && (
            <div className="text-xs text-orange-600 mt-0.5">
              Flash featured until {new Date(job.flash_expires_at).toLocaleDateString()}
            </div>
          )}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ml-3 ${job.status === 'active' && !isExpired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {isExpired ? 'Expired' : job.status === 'active' ? 'Active' : 'Closed'}
        </span>
      </div>

      {job.description && <p className="text-sm text-gray-600 mt-3 line-clamp-3">{job.description}</p>}

      {job.flash_status === 'pending_payment' && (
        <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 mt-3">
          Flash request received — we'll follow up with payment instructions, then feature this on the home page for 7 days once confirmed.
        </p>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <Link to={`/employer/jobs/${job.id}/applicants`} className="text-sm text-teal-600 hover:underline font-medium">
          {job.applicant_count} applicant{job.applicant_count !== '1' ? 's' : ''} →
        </Link>
        <div className="flex gap-3">
          <button onClick={() => setEditing(true)} className="text-xs text-gray-500 hover:text-teal-600 transition">
            Edit
          </button>
          <button onClick={togglePublic} className="text-xs text-gray-500 hover:text-teal-600 transition">
            {job.is_public ? '✓ Open to Public' : 'Vendor Only'}
          </button>
          {!job.flash_status && job.is_public && (
            <Tooltip text="Paid featured placement on the home page for 7 days. Payment is confirmed manually — we'll follow up after you request.">
              <button onClick={requestFlash}
                className="text-xs text-orange-600 hover:text-orange-800 transition">
                🔥 Make Flash Job
              </button>
            </Tooltip>
          )}
          <button onClick={toggleStatus} className="text-xs text-gray-500 hover:text-gray-700 transition">
            {job.status === 'active' ? 'Close' : 'Reopen'}
          </button>
          <button onClick={() => setConfirmingDelete(true)} className="text-xs text-gray-500 hover:text-red-600 transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployerJobs() {
  const [jobs, setJobs] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [defaultIsPublic, setDefaultIsPublic] = useState(true);

  function load() {
    api.get('/api/employer/jobs').then(r => {
      setJobs(r.data);
      setLoaded(true);
    });
  }

  useEffect(() => {
    load();
    api.get('/api/settings').then(r => setDefaultIsPublic(r.data.default_job_is_public !== false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Logo to="/employer/dashboard" />
        <AccountDropdown />
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link to="/employer/dashboard" className="text-sm text-teal-600 hover:underline">← Candidate Pipeline</Link>
            <h1 className="text-2xl font-bold mt-2">Job Postings</h1>
            <p className="text-gray-500 text-sm mt-1">Post openings and review applicants.</p>
            <div className="flex gap-4 mt-2">
              <Link to="/employer/vendor-network" className="text-xs text-teal-600 hover:underline">Vendor Network →</Link>
              <Link to="/employer/vendor-jobs" className="text-xs text-teal-600 hover:underline">Vendor Jobs →</Link>
            </div>
          </div>
          {!showNew && (
            <button onClick={() => setShowNew(true)}
              className="bg-teal-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-teal-700 transition">
              + Post a Job
            </button>
          )}
        </div>

        {showNew && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
            <h2 className="font-semibold mb-4">New Job Posting</h2>
            <JobForm
              submitLabel="Post Job"
              defaultIsPublic={defaultIsPublic}
              onSubmit={async data => {
                await api.post('/api/employer/jobs', data);
                setShowNew(false);
                load();
              }}
              onCancel={() => setShowNew(false)}
            />
          </div>
        )}

        {!loaded ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p>No job postings yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} onUpdated={load} onDeleted={load} />)}
          </div>
        )}
      </main>
    </div>
  );
}
