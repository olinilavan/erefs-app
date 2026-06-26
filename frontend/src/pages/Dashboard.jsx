import Logo from '../components/Logo';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import AccountDropdown from '../components/AccountDropdown';
import { normalizeUrl } from '../utils/url';

const statusColor = { pending: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700' };

function ResumeCard() {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      setUrl(r.data.resume_url || '');
      setLoaded(true);
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await api.put('/api/settings', { resume_url: url });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!loaded) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-xl">📄</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-gray-800 text-sm">Resume Link</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Optional — paste a link to your resume (Google Drive, Dropbox, etc.) to include alongside your reference report. No link handy? You can always share a copy directly yourself.
              </div>
            </div>
            {url && (
              <a href={normalizeUrl(url)} target="_blank" rel="noopener noreferrer"
                className="text-xs text-teal-600 hover:underline whitespace-nowrap ml-4">View →</a>
            )}
          </div>
          <form onSubmit={handleSave} className="flex gap-2 mt-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onBlur={e => setUrl(normalizeUrl(e.target.value))}
              placeholder="https://drive.google.com/..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button type="submit" disabled={saving}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50 whitespace-nowrap">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
          {saved && <p className="text-xs text-green-600 mt-1.5 font-medium">✓ Resume link saved</p>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.get('/api/referrals').then(r => setRequests(r.data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Logo to="/dashboard" />
        <div className="flex items-center gap-5">
          <Link to="/jobs" className="text-sm text-gray-600 hover:text-teal-600 font-medium">
            Open Roles
          </Link>
          <AccountDropdown />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your References</h1>
            <p className="text-gray-500 text-sm mt-1">Track and manage your referral requests</p>
          </div>
          <Link to="/references/new"
            className="bg-teal-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-teal-700 transition">
            + New Request
          </Link>
        </div>

        {user?.role === 'jobseeker' && <ResumeCard />}

        {requests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p>No referral requests yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-6 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{r.target_role || 'General Reference'}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {r.completed_referrers}/{r.total_referrers} referrers completed
                    · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[r.status] || 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                  </span>
                  <Link to={`/references/${r.id}`}
                    className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
