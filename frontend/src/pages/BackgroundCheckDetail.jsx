import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const EDU_VERIFY_STYLE = {
  pending:     'bg-gray-100 text-gray-500',
  verifying:   'bg-yellow-100 text-yellow-700',
  verified:    'bg-green-100 text-green-700',
  discrepancy: 'bg-red-100 text-red-600',
};

const REFERRER_STATUS_STYLE = {
  invited:       'bg-blue-100 text-blue-700',
  viewed:        'bg-yellow-100 text-yellow-700',
  completed:     'bg-green-100 text-green-700',
  declined:      'bg-red-100 text-red-600',
  call_requested:'bg-purple-100 text-purple-700',
};

function EducationCard({ entry, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus]   = useState(entry.verification_status);
  const [notes, setNotes]     = useState(entry.verification_notes || '');
  const [saving, setSaving]   = useState(false);

  async function save() {
    setSaving(true);
    try {
      const r = await api.patch(
        `/api/employer/bg-checks/${entry.check_id}/education/${entry.id}`,
        { verificationStatus: status, verificationNotes: notes }
      );
      onUpdated(r.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-800">{entry.degree_type} — {entry.institution}</div>
          {entry.field_of_study && <div className="text-sm text-gray-500">{entry.field_of_study}</div>}
          <div className="text-xs text-gray-400 mt-0.5">
            {[entry.start_year, entry.graduation_year].filter(Boolean).join(' – ')}
            {entry.gpa ? ` · GPA ${entry.gpa}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${EDU_VERIFY_STYLE[entry.verification_status]}`}>
            {entry.verification_status}
          </span>
          <button onClick={() => setEditing(!editing)}
            className="text-xs text-teal-600 hover:underline font-medium">
            {editing ? 'Cancel' : 'Update'}
          </button>
        </div>
      </div>

      {entry.verification_notes && !editing && (
        <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{entry.verification_notes}</p>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="pending">Pending</option>
            <option value="verifying">Verifying (called institution)</option>
            <option value="verified">Verified ✓</option>
            <option value="discrepancy">Discrepancy found</option>
          </select>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes from verification call (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <button onClick={save} disabled={saving}
            className="text-xs bg-teal-600 text-white px-4 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function BackgroundCheckDetail() {
  const { id } = useParams();
  const [data, setData]   = useState(null);
  const [error, setError] = useState(false);

  function load() {
    api.get(`/api/employer/bg-checks/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError(true));
  }

  useEffect(() => { load(); }, [id]);

  function updateEducationEntry(updated) {
    setData(d => ({ ...d, education: d.education.map(e => e.id === updated.id ? updated : e) }));
  }

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNav />
      <div className="text-center py-20 text-gray-400">Not found.</div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNav />
      <div className="text-center py-20 text-gray-400">Loading…</div>
    </div>
  );

  const { check, education, criminal, referrers } = data;

  const checksRequested = [
    check.include_reference && '📋 Reference Check',
    check.include_education && '🎓 Education Verification',
    check.include_criminal  && '🔍 Criminal Check',
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNav />

      <main className="max-w-3xl mx-auto px-8 py-10">
        <Link to="/employer/dashboard" className="text-sm text-teal-600 hover:underline">← Hiring</Link>

        <div className="flex justify-between items-start mt-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{check.candidate_name}</h1>
            <div className="text-sm text-gray-500 mt-0.5">
              {check.target_role && <span>{check.target_role} · </span>}
              {check.candidate_email}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {checksRequested.map(c => (
                <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{c}</span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[check.status]}`}>
              {STATUS_LABEL[check.status] || check.status}
            </span>
            {check.expires_at && (
              <div className="text-xs text-gray-400 mt-1">
                Deadline: {new Date(check.expires_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Reference checks */}
          {check.include_reference && (
            <section>
              <h2 className="font-semibold text-gray-800 mb-3">📋 References</h2>
              {referrers.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-6 text-center text-gray-400 text-sm">
                  {check.status === 'invited' || check.status === 'in_progress'
                    ? 'Waiting for candidate to provide references…'
                    : 'No references submitted'}
                </div>
              ) : (
                <div className="space-y-3">
                  {referrers.map(r => (
                    <div key={r.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm text-gray-800">{r.name}</div>
                        <div className="text-xs text-gray-400">{r.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${REFERRER_STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-500'}`}>
                          {r.status?.replace('_', ' ')}
                        </span>
                        {r.status === 'completed' && (
                          <Link to={`/references/${r.referral_request_id}`}
                            className="text-xs text-teal-600 hover:underline font-medium">
                            View Report →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Education verification */}
          {check.include_education && (
            <section>
              <h2 className="font-semibold text-gray-800 mb-1">🎓 Education Verification</h2>
              <p className="text-xs text-gray-400 mb-3">
                Manually verify each degree by contacting the institution, then mark its status below.
              </p>
              {education.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-6 text-center text-gray-400 text-sm">
                  {check.status === 'invited' || check.status === 'in_progress'
                    ? 'Waiting for candidate to submit education details…'
                    : 'No education entries submitted'}
                </div>
              ) : (
                <div className="space-y-3">
                  {education.map(e => (
                    <EducationCard key={e.id} entry={e} onUpdated={updateEducationEntry} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Criminal check */}
          {check.include_criminal && (
            <section>
              <h2 className="font-semibold text-gray-800 mb-3">🔍 Criminal Background Check</h2>
              {!criminal ? (
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-6 text-center text-gray-400 text-sm">
                  {check.status === 'invited' || check.status === 'in_progress'
                    ? 'Waiting for candidate consent…'
                    : 'No consent received'}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                      criminal.status === 'completed' ? 'bg-green-100 text-green-700'
                        : criminal.status === 'processing' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {criminal.status}
                    </span>
                    {criminal.consent_given && (
                      <span className="text-xs text-green-700 font-medium">✓ Consent given {criminal.consent_at ? `· ${new Date(criminal.consent_at).toLocaleDateString()}` : ''}</span>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">Date of birth</span>
                      <span className="text-gray-700">{criminal.date_of_birth ? new Date(criminal.date_of_birth).toLocaleDateString() : '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block mb-0.5">Address</span>
                      <span className="text-gray-700 whitespace-pre-line">{criminal.address || '—'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Processing is handled manually. Contact a licensed Consumer Reporting Agency (CRA) with the above details, then update the check status when results are available.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
