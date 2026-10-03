import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import EmployerNav from '../components/EmployerNav';
import Tooltip from '../components/Tooltip';

const LINK_STATUS_BADGE = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-gray-100 text-gray-500',
  revoked:  'bg-red-100 text-red-600',
};

const SPECIALIZATIONS = [
  'IT / Technology', 'Healthcare', 'Finance & Accounting', 'Engineering',
  'Marketing & Creative', 'Sales & Business Development', 'Legal & Compliance',
  'Operations & Admin', 'Construction & Trades', 'Education & Training',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
  'Nationwide',
];

const PLACEMENT_VOLUMES = ['1–10 / month', '10–50 / month', '50–100 / month', '100+ / month'];

function ProfileModal({ target, onClose, onSubmit }) {
  const [form, setForm] = useState({
    specializations: target?.vendor_specializations || [],
    states: target?.vendor_states || [],
    bio: target?.vendor_bio || '',
    website: target?.vendor_website || '',
    placementVolume: target?.vendor_placement_volume || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleSpec(s) {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(s)
        ? f.specializations.filter(x => x !== s)
        : f.specializations.length < 5 ? [...f.specializations, s] : f.specializations,
    }));
  }

  function toggleState(s) {
    setForm(f => ({
      ...f,
      states: f.states.includes(s) ? f.states.filter(x => x !== s) : [...f.states, s],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.specializations.length) { setError('Please select at least one specialization.'); return; }
    if (!form.states.length) { setError('Please select at least one state.'); return; }
    if (!form.bio.trim()) { setError('Please add a short agency introduction.'); return; }
    setError('');
    setSaving(true);
    try {
      let website = form.website.trim() || null;
      if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
      await onSubmit({
        specializations: form.specializations,
        states: form.states,
        bio: form.bio.trim(),
        website,
        placementVolume: form.placementVolume || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Complete your vendor profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            This helps {target?.company || target?.name || 'the buyer'} understand your agency before approving you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Specializations */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Specialization areas <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(select up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSpec(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                    form.specializations.includes(s)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-200 text-gray-600 hover:border-teal-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* States */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              States you operate in <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50">
              {US_STATES.map(s => (
                <button key={s} type="button" onClick={() => toggleState(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                    form.states.includes(s)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-200 text-gray-600 bg-white hover:border-teal-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            {form.states.length > 0 && (
              <p className="text-xs text-teal-600 mt-1">{form.states.join(', ')}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Agency introduction <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3} maxLength={400}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Brief intro about your agency — what you do, who you place, and what makes you different."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-400 mt-0.5">{form.bio.length} / 400</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Website */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
              <input type="text" value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="www.youragency.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Placement volume */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Placements per month</label>
              <select value={form.placementVolume}
                onChange={e => setForm(f => ({ ...f, placementVolume: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                <option value="">Select…</option>
                {PLACEMENT_VOLUMES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition">
              {saving ? 'Sending…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VendorProfileCard({ vendor }) {
  const specs = vendor.vendor_specializations || [];
  const states = vendor.vendor_states || [];
  if (!vendor.vendor_bio && !specs.length && !states.length) return null;

  return (
    <div className="mt-3 bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
      {vendor.vendor_bio && (
        <p className="text-sm text-gray-700 leading-relaxed">{vendor.vendor_bio}</p>
      )}
      {specs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Specializations</p>
          <div className="flex flex-wrap gap-1.5">
            {specs.map(s => (
              <span key={s} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}
      {states.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Operating States</p>
          <div className="flex flex-wrap gap-1.5">
            {states.map(s => (
              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-0.5">
        {vendor.vendor_placement_volume && <span>📦 {vendor.vendor_placement_volume}</span>}
        {vendor.vendor_website && (
          <a href={vendor.vendor_website} target="_blank" rel="noopener noreferrer"
            className="text-teal-600 hover:underline">
            🌐 Website
          </a>
        )}
      </div>
    </div>
  );
}

export default function EmployerVendorNetwork() {
  const [directory, setDirectory] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [links, setLinks] = useState([]);
  const [tab, setTab] = useState('links');
  const [requesting, setRequesting] = useState({});
  const [profileModal, setProfileModal] = useState(null); // { buyerEmployerId, company, name }
  const [myProfile, setMyProfile] = useState(null);
  const [expandedIncoming, setExpandedIncoming] = useState({});

  function loadAll() {
    api.get('/api/employer/vendors/directory').then(r => setDirectory(r.data));
    api.get('/api/employer/vendors/incoming').then(r => setIncoming(r.data));
    api.get('/api/employer/vendors/links').then(r => setLinks(r.data));
  }

  useEffect(() => {
    loadAll();
    api.get('/api/settings').then(r => setMyProfile(r.data));
  }, []);

  function openRequestModal(employer) {
    setProfileModal(employer);
  }

  async function submitRequest(profileData) {
    await api.post('/api/employer/vendors/request', {
      buyerEmployerId: profileModal.id,
      ...profileData,
    });
    setMyProfile(p => p ? { ...p, ...profileData } : p);
    setProfileModal(null);
    loadAll();
  }

  async function approve(id) {
    await api.post(`/api/employer/vendors/${id}/approve`);
    loadAll();
  }

  async function decline(id) {
    await api.post(`/api/employer/vendors/${id}/decline`);
    loadAll();
  }

  async function revoke(id) {
    await api.delete(`/api/employer/vendors/links/${id}`);
    loadAll();
  }

  function toggleExpand(id) {
    setExpandedIncoming(p => ({ ...p, [id]: !p[id] }));
  }

  const profileComplete = myProfile && (
    (myProfile.vendor_specializations?.length > 0) ||
    myProfile.vendor_bio
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNav />

      {profileModal && (
        <ProfileModal
          target={profileModal}
          onClose={() => setProfileModal(null)}
          onSubmit={submitRequest}
        />
      )}

      <main className="max-w-4xl mx-auto px-8 py-10">
        <Link to="/employer/dashboard" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Vendor Network</h1>
        <p className="text-gray-500 text-sm mb-8">
          Request to become another employer's vendor, or approve vendors who want to supply candidates for your job postings.
        </p>

        {/* Profile completeness nudge */}
        {!profileComplete && myProfile && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              Complete your vendor profile so buyers know who you are before approving your requests.
            </p>
            <Link to="/settings" className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">
              Complete profile →
            </Link>
          </div>
        )}

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 max-w-md">
          {[
            ['links', 'My Links'],
            ['directory', 'Find Employers'],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === key ? 'bg-white shadow text-teal-700' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'links' && (
          <div className="space-y-6">
            {incoming.length > 0 && (
              <div className="bg-white rounded-2xl border border-yellow-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-yellow-100 bg-yellow-50 text-sm font-semibold text-gray-700">
                  Incoming Vendor Requests ({incoming.length})
                </div>
                <div className="divide-y divide-gray-50">
                  {incoming.map(r => (
                    <div key={r.id} className="px-5 py-4">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-800">{r.vendor_company || r.vendor_name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{r.vendor_email}</div>
                          <div className="text-xs text-gray-400">
                            Requested {new Date(r.requested_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          {(r.vendor_bio || (r.vendor_specializations?.length > 0)) && (
                            <button onClick={() => toggleExpand(r.id)}
                              className="text-xs text-teal-600 hover:text-teal-800 font-medium">
                              {expandedIncoming[r.id] ? 'Hide profile' : 'View profile'}
                            </button>
                          )}
                          <button onClick={() => decline(r.id)} className="text-xs text-gray-500 hover:text-red-600 font-medium">Decline</button>
                          <button onClick={() => approve(r.id)}
                            className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 font-medium">Approve</button>
                        </div>
                      </div>
                      {expandedIncoming[r.id] && <VendorProfileCard vendor={r} />}
                      {!r.vendor_bio && !(r.vendor_specializations?.length > 0) && (
                        <p className="text-xs text-gray-400 mt-2 italic">No vendor profile provided.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
                Active &amp; Past Links
              </div>
              <div className="divide-y divide-gray-50">
                {links.map(l => (
                  <div key={l.id} className="px-5 py-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        {l.buyer_company || l.buyer_name} ← {l.vendor_company || l.vendor_name}
                      </div>
                      <div className="text-xs text-gray-400">Vendor supplies candidates to Buyer</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LINK_STATUS_BADGE[l.status]}`}>{l.status}</span>
                      {l.status === 'approved' && (
                        <button onClick={() => revoke(l.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Revoke</button>
                      )}
                    </div>
                  </div>
                ))}
                {links.length === 0 && (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">No links yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'directory' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              Other Employers — request to become their vendor
            </div>
            <div className="divide-y divide-gray-50">
              {directory.map(e => (
                <div key={e.id} className="px-5 py-4 flex justify-between items-center">
                  <div className="font-medium text-sm text-gray-800">{e.company || e.name}</div>
                  {e.link_status ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LINK_STATUS_BADGE[e.link_status]}`}>{e.link_status}</span>
                  ) : (
                    <Tooltip text="You'll be asked to complete a short vendor profile before submitting. Once approved, their job postings will appear under Vendor Jobs.">
                      <button onClick={() => openRequestModal(e)} disabled={requesting[e.id]}
                        className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50">
                        Request to be their Vendor
                      </button>
                    </Tooltip>
                  )}
                </div>
              ))}
              {directory.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">No other employers yet</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
