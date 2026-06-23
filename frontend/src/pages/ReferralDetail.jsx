import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { isPersonalEmail } from '../utils/emailValidation';
import { normalizeUrl } from '../utils/url';

const REFERRER_STATUS_STYLE = {
  invited:       'bg-yellow-100 text-yellow-700',
  viewed:        'bg-blue-100 text-blue-700',
  completed:     'bg-green-100 text-green-700',
  declined:      'bg-red-100 text-red-700',
  call_requested:'bg-purple-100 text-purple-700',
};

const REFERRER_STATUS_LABEL = {
  invited:       'Invited',
  viewed:        'Viewed',
  completed:     'Completed',
  declined:      'Declined',
  call_requested:'Call Requested',
};

const REQUEST_STATUS_STYLE = {
  completed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
};

function CandidateProfileStatus({ request }) {
  const p = request.linkedin_analysis_json;
  if (p) return <ProfileSection p={p} url={request.candidate_linkedin_url} />;

  if (request.candidate_profile_submitted_at) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-6">
        <p className="text-sm text-gray-500 italic">Analyzing candidate's professional summary…</p>
      </div>
    );
  }

  if (request.candidate_token) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-6">
        <p className="text-sm text-gray-700">Waiting on candidate to add their professional summary.</p>
        <p className="text-xs text-gray-500 mt-1">They were emailed a link to add it directly — this is optional on their end.</p>
      </div>
    );
  }

  return null;
}

function ProfileSection({ p, url }) {
  const strengthColor = { Beginner: 'text-gray-500', Intermediate: 'text-blue-600', Advanced: 'text-teal-600', Expert: 'text-indigo-600' };
  const scoreColor = p.profileScore >= 80 ? 'text-teal-700' : p.profileScore >= 60 ? 'text-blue-700' : 'text-yellow-700';
  const scoreBg = p.profileScore >= 80 ? 'bg-teal-50' : p.profileScore >= 60 ? 'bg-blue-50' : 'bg-yellow-50';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="font-semibold text-gray-800">Professional Profile</h2>
          {url && (
            <a href={normalizeUrl(url)} target="_blank" rel="noopener noreferrer"
              className="text-xs text-teal-600 hover:underline mt-0.5 block">View LinkedIn →</a>
          )}
        </div>
        <div className={`text-center ${scoreBg} rounded-xl px-4 py-2`}>
          <div className={`text-2xl font-bold ${scoreColor}`}>{p.profileScore}</div>
          <div className="text-xs text-gray-500 mt-0.5">Profile Score</div>
        </div>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-5">{p.summary}</p>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          {(p.currentTitle || p.currentCompany) && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Role</div>
              <div className="text-sm text-gray-800 font-medium">{p.currentTitle}</div>
              {p.currentCompany && <div className="text-sm text-gray-600">{p.currentCompany}</div>}
            </div>
          )}
          {p.experienceYears != null && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Experience</div>
              <div className="text-sm text-gray-800">{p.experienceYears} year{p.experienceYears !== 1 ? 's' : ''}</div>
            </div>
          )}
          {p.profileStrength && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Profile Strength</div>
              <div className={`text-sm font-semibold ${strengthColor[p.profileStrength] || 'text-gray-700'}`}>{p.profileStrength}</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {p.topSkills?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {p.topSkills.map((s, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}
          {p.educationHighlights?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Education</div>
              <ul className="space-y-0.5">
                {p.educationHighlights.map((e, i) => (
                  <li key={i} className="text-sm text-gray-700">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {p.careerTrajectory && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Career Trajectory</div>
          <p className="text-sm text-gray-700">{p.careerTrajectory}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
        Based on information the candidate shared directly — not independently verified.
      </p>
    </div>
  );
}

function CopyLinkButton({ token }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/ref/${token}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

function CopyCombinedLinkButton({ shareToken }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/referrals/share/${shareToken}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition"
    >
      {copied ? '✓ Copied!' : '🔗 Copy Combined Share Link'}
    </button>
  );
}

export default function ReferralDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const dashboardPath = user?.is_admin ? '/admin' : user?.role === 'employer' ? '/employer/dashboard' : '/dashboard';
  const [rows, setRows] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [requireWorkEmail, setRequireWorkEmail] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => setRequireWorkEmail(r.data.require_work_email)).catch(() => {});
  }, []);

  function load() {
    api.get(`/api/referrals/${id}`).then(r => setRows(r.data));
  }

  useEffect(() => { load(); }, [id]);

  const request = rows[0];
  const referrers = rows.filter(r => r.referrer_id);
  const submittedCount = referrers.filter(r => r.referrer_status === 'completed').length;

  async function addReferrer(e) {
    e.preventDefault();
    setAddError('');
    if (requireWorkEmail && isPersonalEmail(newEmail)) {
      setAddError('Work email required — please use a corporate email address.');
      return;
    }
    setAdding(true);
    try {
      await api.post(`/api/referrals/${id}/referrers`, { name: newName, email: newEmail });
      setNewName('');
      setNewEmail('');
      setAddOpen(false);
      load();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setAdding(false);
    }
  }

  const isPending = s => s === 'invited' || s === 'viewed';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <Link
          to={dashboardPath}
          state={user?.is_admin && request?.requester_id ? { employerId: request.requester_id } : undefined}
          className="text-xl font-bold text-teal-700"
        >← Dashboard</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-10">

        {/* Candidate header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold">{request?.target_role || 'General Reference'}</h1>
              {request?.candidate_name && (
                <div className="text-gray-500 text-sm mt-0.5">Candidate: {request.candidate_name}</div>
              )}
              <div className="text-gray-400 text-xs mt-1">
                Created {request && new Date(request.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${REQUEST_STATUS_STYLE[request?.status] || 'bg-gray-100 text-gray-600'}`}>
                {request?.status}
              </span>
              {request?.archived_at && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-500">
                  Archived
                </span>
              )}
              <span className="text-xs text-gray-400">{submittedCount} / {referrers.length} completed</span>
            </div>
          </div>
        </div>

        {submittedCount >= 2 && request?.share_token && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-5 py-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-800">Share all {submittedCount} completed reports at once</p>
              <p className="text-xs text-gray-500 mt-0.5">One link instead of sending each report separately.</p>
            </div>
            <CopyCombinedLinkButton shareToken={request.share_token} />
          </div>
        )}

        {request && <CandidateProfileStatus request={request} />}

        {/* Referrer list */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700">Referrers</h2>
          {!request?.archived_at && (
            <button
              onClick={() => setAddOpen(o => !o)}
              className="text-sm text-teal-600 hover:text-teal-800 font-medium"
            >
              + Add Referrer
            </button>
          )}
        </div>

        {/* Add referrer inline form */}
        {addOpen && (
          <form onSubmit={addReferrer} className="bg-teal-50 border border-teal-200 rounded-xl px-5 py-4 mb-3 space-y-2">
            {addError && <p className="text-xs text-red-500">{addError}</p>}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Jane Smith"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                required
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="jane@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition disabled:opacity-50"
            >
              {adding ? 'Sending…' : 'Send Invite'}
            </button>
            <button type="button" onClick={() => { setAddOpen(false); setAddError(''); }} className="text-gray-400 hover:text-gray-600 text-sm px-2">
              Cancel
            </button>
          </div>
          </form>
        )}

        <div className="space-y-3">
          {referrers.map(r => {
            const statusKey = r.referrer_status || 'invited';
            return (
              <div key={r.referrer_id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{r.referrer_name}</div>
                    <div className="text-sm text-gray-400">{r.referrer_email}</div>
                    {statusKey === 'viewed' && r.viewed_at && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Viewed {new Date(r.viewed_at).toLocaleDateString()}
                      </div>
                    )}
                    {statusKey === 'completed' && r.submitted_at && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Completed {new Date(r.submitted_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${REFERRER_STATUS_STYLE[statusKey] || 'bg-gray-100 text-gray-600'}`}>
                      {REFERRER_STATUS_LABEL[statusKey] || statusKey}
                    </span>
                    {isPending(statusKey) && <CopyLinkButton token={r.token} />}
                    {r.report_id && (
                      <Link
                        to={`/reports/${r.report_id}`}
                        className="text-sm bg-teal-600 text-white px-4 py-1.5 rounded-lg hover:bg-teal-700 transition"
                      >
                        View Report
                      </Link>
                    )}
                    {statusKey === 'completed' && !r.report_id && (
                      <span className="text-xs text-gray-400 italic">Generating…</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status legend */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status guide</p>
          <div className="space-y-2">
            {[
              { key: 'invited',        desc: 'Invite sent, no action yet' },
              { key: 'viewed',         desc: 'Clicked the form link, hasn\'t submitted yet' },
              { key: 'completed',      desc: 'Submitted the questionnaire' },
              { key: 'declined',       desc: 'Unable to provide a reference' },
              { key: 'call_requested', desc: 'Prefers a conversation over the form' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${REFERRER_STATUS_STYLE[key]}`}>
                  {REFERRER_STATUS_LABEL[key]}
                </span>
                <span className="text-xs text-gray-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
