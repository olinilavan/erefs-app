import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AccountDropdown from '../components/AccountDropdown';
import Logo from '../components/Logo';
import Tooltip from '../components/Tooltip';

function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
      </div>
      <button type="button" onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-teal-600' : 'bg-gray-200'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => setForm(r.data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await api.put('/api/settings', {
      name: form.name,
      company: form.company,
      headline: form.headline,
      require_work_email: form.require_work_email,
      reminder_days: form.reminder_days,
      wants_custom_questions: form.wants_custom_questions,
      share_link_expiry_days: form.share_link_expiry_days,
      publicly_discoverable: form.publicly_discoverable,
      allow_employer_contact: form.allow_employer_contact,
      years_experience: form.years_experience,
      location: form.location,
      availability: form.availability,
      default_job_is_public: form.default_job_is_public,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const dashboardPath = user?.role === 'employer' ? '/employer/dashboard' : '/dashboard';

  if (!form) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Logo to={dashboardPath} />
        <AccountDropdown />
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your profile and preferences</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Profile */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Profile</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input value={form.email} disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            {user?.role === 'employer' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Company</label>
                <input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Acme Corp" />
              </div>
            )}
            {user?.role === 'jobseeker' && (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Headline</label>
                  <input value={form.headline || ''} onChange={e => setForm({ ...form, headline: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="e.g. Senior Software Engineer" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-sm text-gray-600">Your VM ID</label>
                    <Tooltip text="A non-identifying code generated for you automatically. Share it with recruiters or employers instead of your real name — they search for it in the Talent Directory.">
                      <span className="text-gray-400 cursor-default text-xs leading-none">ⓘ</span>
                    </Tooltip>
                  </div>
                  <input value={form.vm_id || ''} disabled
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed font-mono" />
                </div>
              </>
            )}
          </div>

          {/* Reference preferences — employer only */}
          {user?.role === 'employer' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">Reference Preferences</h2>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-700">Work email only</span>
                    <Tooltip text="Referrers using Gmail, Yahoo, Hotmail, or other personal email providers will be blocked from submitting a response. Useful when you need verifiable corporate identity.">
                      <span className="text-gray-400 cursor-default text-xs leading-none">ⓘ</span>
                    </Tooltip>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Only accept responses from corporate email addresses (no Gmail, Yahoo, etc.)</div>
                </div>
                <button type="button" onClick={() => setForm({ ...form, require_work_email: !form.require_work_email })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${form.require_work_email ? 'bg-teal-600' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${form.require_work_email ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <Toggle
                enabled={form.wants_custom_questions}
                onChange={v => setForm({ ...form, wants_custom_questions: v })}
                label="Custom question sets"
                description="Use your own domain-specific questions instead of the standard set. (Available in next phase)"
              />

              {form.wants_custom_questions && (
                <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-3 text-sm text-teal-700">
                  Your interest has been noted. Custom question sets will be available in an upcoming release.
                </div>
              )}

              <div>
                <Toggle
                  enabled={form.reminder_days > 0}
                  onChange={v => setForm({ ...form, reminder_days: v ? 7 : 0 })}
                  label="Send referrer reminders"
                  description="Automatically email referrers who haven't responded after a set number of days."
                />
                {form.reminder_days > 0 && (
                  <div className="flex items-center gap-3 mt-3 ml-1">
                    <span className="text-sm text-gray-500">Remind after</span>
                    <select value={form.reminder_days}
                      onChange={e => setForm({ ...form, reminder_days: parseInt(e.target.value) })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                      {[3, 5, 7, 10, 14].map(d => (
                        <option key={d} value={d}>{d} days</option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-500">after invite is sent</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendor network — employer only */}
          {user?.role === 'employer' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">Vendor Network</h2>

              <Toggle
                enabled={form.default_job_is_public !== false}
                onChange={v => setForm({ ...form, default_job_is_public: v })}
                label="New jobs default to Open to Public"
                description="When off, new job postings default to Vendor Only instead. You can still change this per posting."
              />

              <Link to="/employer/vendor-network" className="text-sm text-teal-600 hover:underline font-medium inline-block">
                Manage Vendor Network →
              </Link>
            </div>
          )}

          {/* Talent directory — jobseeker only */}
          {user?.role === 'jobseeker' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">Visibility to Employers</h2>

              <Toggle
                enabled={form.publicly_discoverable}
                onChange={v => setForm({ ...form, publicly_discoverable: v, allow_employer_contact: v ? form.allow_employer_contact : false })}
                label="Show my profile publicly"
                description="Logged-in employers can see your headline and whether you have a completed reference — never your name or email."
              />

              {form.publicly_discoverable && (
                <>
                  <Toggle
                    enabled={form.allow_employer_contact}
                    onChange={v => setForm({ ...form, allow_employer_contact: v })}
                    label="Allow employers to reach out"
                    description="Interested employers submit their contact info to VouchMetrics, and we email it to you. Your contact info is never shared with them unless you respond."
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Years of experience</label>
                      <input type="number" min="0" value={form.years_experience ?? ''}
                        onChange={e => setForm({ ...form, years_experience: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder="e.g. 6" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Location</label>
                      <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                        placeholder="e.g. Austin, TX" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Availability</label>
                    <select value={form.availability || ''}
                      onChange={e => setForm({ ...form, availability: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                      <option value="">Select...</option>
                      <option value="Immediately">Immediately</option>
                      <option value="Within 2 weeks">Within 2 weeks</option>
                      <option value="Within 1 month">Within 1 month</option>
                      <option value="Not actively looking">Not actively looking</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reference preferences — jobseeker only */}
          {user?.role === 'jobseeker' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold text-gray-800">Share Link Expiration</h2>
                <Tooltip text="Your report share links (single or combined) stop working after this period. If someone tries to open an expired link they'll see an error. Start a new referral request to get a fresh link.">
                  <span className="text-gray-400 cursor-default text-xs leading-none">ⓘ</span>
                </Tooltip>
              </div>
              <p className="text-xs text-gray-400">
                Report share links (single and combined) stop working after this period. Generate a new request to get a fresh link.
              </p>
              <div className="flex items-center gap-3">
                <select value={form.share_link_expiry_days || 14}
                  onChange={e => setForm({ ...form, share_link_expiry_days: parseInt(e.target.value) })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {[7, 14, 30, 60, 90].map(d => (
                    <option key={d} value={d}>{d} days</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">from when the link is generated</span>
              </div>
            </div>
          )}

          {/* Subscription */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Subscription</h2>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{form.subscription_plan} Plan</span>
                  <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full font-medium">Active</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Member since {new Date(form.subscription_started_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button type="button" disabled
                className="text-sm border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed">
                Upgrade — Coming Soon
              </button>
            </div>
          </div>

          {/* Billing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-800">Billing & Payments</h2>
                <p className="text-xs text-gray-400 mt-1">Payment integration available after beta period</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">Coming Soon</span>
            </div>
          </div>

          {/* Legal */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">Legal</h2>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-700">Terms & Conditions</div>
                {form.terms_accepted_at && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    Accepted on {new Date(form.terms_accepted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>
              <Link to="/terms" target="_blank"
                className="text-sm text-teal-600 hover:underline font-medium">
                View →
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Changes saved</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
