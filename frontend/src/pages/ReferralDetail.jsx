import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const STATUS_STYLE = {
  completed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
};

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

export default function ReferralDetail() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);

  function load() {
    axios.get(`/api/referrals/${id}`).then(r => setRows(r.data));
  }

  useEffect(() => { load(); }, [id]);

  const request = rows[0];
  const referrers = rows.filter(r => r.referrer_id);
  const submittedCount = referrers.filter(r => r.submitted_at).length;

  async function addReferrer(e) {
    e.preventDefault();
    setAdding(true);
    try {
      await axios.post(`/api/referrals/${id}/referrers`, { name: newName, email: newEmail });
      setNewName('');
      setNewEmail('');
      setAddOpen(false);
      load();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <Link to="/dashboard" className="text-xl font-bold text-indigo-700">← Dashboard</Link>
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
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLE[request?.status] || 'bg-gray-100 text-gray-600'}`}>
                {request?.status}
              </span>
              <span className="text-xs text-gray-400">{submittedCount} / {referrers.length} submitted</span>
            </div>
          </div>
        </div>

        {/* Referrer list */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700">Referrers</h2>
          <button
            onClick={() => setAddOpen(o => !o)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Add Referrer
          </button>
        </div>

        {/* Add referrer inline form */}
        {addOpen && (
          <form onSubmit={addReferrer} className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 mb-3 flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="jane@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {adding ? 'Sending…' : 'Send Invite'}
            </button>
            <button type="button" onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm px-2">
              Cancel
            </button>
          </form>
        )}

        <div className="space-y-3">
          {referrers.map(r => (
            <div key={r.referrer_id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{r.referrer_name}</div>
                  <div className="text-sm text-gray-400">{r.referrer_email}</div>
                  {r.submitted_at && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Submitted {new Date(r.submitted_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${r.submitted_at ? STATUS_STYLE.completed : STATUS_STYLE.pending}`}>
                    {r.submitted_at ? 'Submitted' : 'Pending'}
                  </span>
                  {!r.submitted_at && <CopyLinkButton token={r.token} />}
                  {r.report_id && (
                    <Link
                      to={`/reports/${r.report_id}`}
                      className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                    >
                      View Report
                    </Link>
                  )}
                  {r.submitted_at && !r.report_id && (
                    <span className="text-xs text-gray-400 italic">Generating…</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
