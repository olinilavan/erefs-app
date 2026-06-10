import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AccountDropdown from '../components/AccountDropdown';

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
        <Link to={dashboardPath} className="text-xl font-bold text-indigo-700">
          eRefs<span className="text-gray-400">.ai</span>
        </Link>
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Acme Corp" />
              </div>
            )}
            {user?.role === 'jobseeker' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Headline</label>
                <input value={form.headline || ''} onChange={e => setForm({ ...form, headline: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Senior Software Engineer" />
              </div>
            )}
          </div>

          {/* Reference preferences — employer only */}
          {user?.role === 'employer' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">Reference Preferences</h2>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Work email only</div>
                  <div className="text-xs text-gray-400 mt-0.5">Only accept responses from corporate email addresses (no Gmail, Yahoo, etc.)</div>
                </div>
                <button type="button"
                  onClick={() => setForm({ ...form, require_work_email: !form.require_work_email })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${form.require_work_email ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${form.require_work_email ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Remind me if referrer hasn't responded in</div>
                <div className="flex items-center gap-3">
                  <select value={form.reminder_days}
                    onChange={e => setForm({ ...form, reminder_days: parseInt(e.target.value) })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {[3, 5, 7, 10, 14].map(d => (
                      <option key={d} value={d}>{d} days</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">after invite is sent</span>
                </div>
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
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Active</span>
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

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Changes saved</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
