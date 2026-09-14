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
  pending:        'bg-gray-100 text-gray-500',
  verifying:      'bg-yellow-100 text-yellow-700',
  verified:       'bg-green-100 text-green-700',
  discrepancy:    'bg-red-100 text-red-600',
  unable_to_reach:'bg-orange-100 text-orange-700',
};

const EMP_VERIFY_LABEL = {
  pending:        'Pending',
  verifying:      'Verifying',
  verified:       'Verified',
  discrepancy:    'Discrepancy',
  unable_to_reach:'Unable to Reach',
};

const REFERRER_STATUS_STYLE = {
  invited:       'bg-blue-100 text-blue-700',
  viewed:        'bg-yellow-100 text-yellow-700',
  completed:     'bg-green-100 text-green-700',
  declined:      'bg-red-100 text-red-600',
  call_requested:'bg-purple-100 text-purple-700',
};

function EmploymentCard({ entry, onUpdated }) {
  const [editing, setEditing]           = useState(false);
  const [status, setStatus]             = useState(entry.verification_status);
  const [contactPerson, setContactPerson] = useState(entry.contact_person || '');
  const [contactRole, setContactRole]   = useState(entry.contact_role || '');
  const [contactPhone, setContactPhone] = useState(entry.contact_phone || '');
  const [notes, setNotes]               = useState(entry.verification_notes || '');
  const [saving, setSaving]             = useState(false);

  const dateRange = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const from = [entry.start_month ? months[entry.start_month - 1] : null, entry.start_year].filter(Boolean).join(' ');
    const to   = entry.is_current ? 'Present'
      : [entry.end_month ? months[entry.end_month - 1] : null, entry.end_year].filter(Boolean).join(' ');
    return [from, to].filter(Boolean).join(' – ');
  })();

  async function save() {
    setSaving(true);
    try {
      const r = await api.patch(
        `/api/employer/bg-checks/${entry.check_id}/employment/${entry.id}`,
        { verificationStatus: status, contactPerson, contactRole, contactPhone, verificationNotes: notes }
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
          <div className="font-medium text-gray-800">{entry.job_title} — {entry.employer_name}</div>
          {dateRange && <div className="text-xs text-gray-400 mt-0.5">{dateRange}</div>}
          {entry.supervisor_name && (
            <div className="text-xs text-gray-500 mt-0.5">
              Supervisor: {entry.supervisor_name}
              {entry.supervisor_contact && <span className="text-gray-400"> · {entry.supervisor_contact}</span>}
            </div>
          )}
          {entry.reason_for_leaving && (
            <div className="text-xs text-gray-400 mt-0.5 italic">Left: {entry.reason_for_leaving}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EDU_VERIFY_STYLE[entry.verification_status]}`}>
            {EMP_VERIFY_LABEL[entry.verification_status] || entry.verification_status}
          </span>
          <button onClick={() => setEditing(!editing)}
            className="text-xs text-teal-600 hover:underline font-medium">
            {editing ? 'Cancel' : 'Update'}
          </button>
        </div>
      </div>

      {!editing && (entry.contact_person || entry.verification_notes) && (
        <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
          {entry.contact_person && (
            <p className="text-xs text-gray-600">
              Spoke with: <span className="font-medium">{entry.contact_person}</span>
              {entry.contact_role && <span className="text-gray-400"> · {entry.contact_role}</span>}
              {entry.contact_phone && <span className="text-gray-400"> · {entry.contact_phone}</span>}
            </p>
          )}
          {entry.verification_notes && (
            <p className="text-sm text-gray-600">{entry.verification_notes}</p>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="pending">Pending</option>
            <option value="verifying">Verifying (called employer)</option>
            <option value="verified">Verified ✓</option>
            <option value="discrepancy">Discrepancy found</option>
            <option value="unable_to_reach">Unable to reach</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input value={contactPerson} onChange={e => setContactPerson(e.target.value)}
              placeholder="Contact person name"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <input value={contactRole} onChange={e => setContactRole(e.target.value)}
              placeholder="Their role / title"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
            placeholder="Phone number called"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Verification notes — what was discussed, any discrepancies, feedback given…"
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

function EducationCard({ entry, onUpdated }) {
  const [editing, setEditing]             = useState(false);
  const [status, setStatus]               = useState(entry.verification_status);
  const [contactPerson, setContactPerson] = useState(entry.contact_person || '');
  const [contactRole, setContactRole]     = useState(entry.contact_role || '');
  const [contactPhone, setContactPhone]   = useState(entry.contact_phone || '');
  const [notes, setNotes]                 = useState(entry.verification_notes || '');
  const [saving, setSaving]               = useState(false);

  async function save() {
    setSaving(true);
    try {
      const r = await api.patch(
        `/api/employer/bg-checks/${entry.check_id}/education/${entry.id}`,
        { verificationStatus: status, contactPerson, contactRole, contactPhone, verificationNotes: notes }
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
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EDU_VERIFY_STYLE[entry.verification_status]}`}>
            {EMP_VERIFY_LABEL[entry.verification_status] || entry.verification_status}
          </span>
          <button onClick={() => setEditing(!editing)}
            className="text-xs text-teal-600 hover:underline font-medium">
            {editing ? 'Cancel' : 'Update'}
          </button>
        </div>
      </div>

      {!editing && (entry.contact_person || entry.verification_notes) && (
        <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 space-y-0.5">
          {entry.contact_person && (
            <p className="text-xs text-gray-600">
              Spoke with: <span className="font-medium">{entry.contact_person}</span>
              {entry.contact_role && <span className="text-gray-400"> · {entry.contact_role}</span>}
              {entry.contact_phone && <span className="text-gray-400"> · {entry.contact_phone}</span>}
            </p>
          )}
          {entry.verification_notes && (
            <p className="text-sm text-gray-600">{entry.verification_notes}</p>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="pending">Pending</option>
            <option value="verifying">Verifying (called institution)</option>
            <option value="verified">Verified ✓</option>
            <option value="discrepancy">Discrepancy found</option>
            <option value="unable_to_reach">Unable to reach</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input value={contactPerson} onChange={e => setContactPerson(e.target.value)}
              placeholder="Contact person name"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <input value={contactRole} onChange={e => setContactRole(e.target.value)}
              placeholder="Their role (e.g. Registrar's Office)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
            placeholder="Phone number called"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Verification notes — what was confirmed, any discrepancies…"
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
  const [data, setData]         = useState(null);
  const [error, setError]       = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError]   = useState('');
  const [addingRef, setAddingRef]   = useState(false);
  const [refForm, setRefForm]       = useState({ name: '', email: '' });
  const [savingRef, setSavingRef]   = useState(false);
  const [refError, setRefError]     = useState('');

  function load() {
    api.get(`/api/employer/bg-checks/${id}`)
      .then(r => setData(r.data))
      .catch(() => setError(true));
  }

  useEffect(() => { load(); }, [id]);

  function updateEducationEntry(updated) {
    setData(d => ({ ...d, education: d.education.map(e => e.id === updated.id ? updated : e) }));
  }

  function updateEmploymentEntry(updated) {
    setData(d => ({ ...d, employment: d.employment.map(e => e.id === updated.id ? updated : e) }));
  }

  async function saveInfo(e) {
    e.preventDefault();
    setSavingInfo(true); setInfoError('');
    try {
      const r = await api.patch(`/api/employer/bg-checks/${id}`, editForm);
      setData(d => ({ ...d, check: r.data }));
      setEditingInfo(false);
    } catch (err) {
      setInfoError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSavingInfo(false);
    }
  }

  async function saveReferrer(e) {
    e.preventDefault();
    setSavingRef(true); setRefError('');
    try {
      const r = await api.post(`/api/employer/bg-checks/${id}/referrers`, refForm);
      setData(d => ({ ...d, referrers: [...d.referrers, r.data] }));
      setRefForm({ name: '', email: '' });
      setAddingRef(false);
    } catch (err) {
      setRefError(err.response?.data?.error || 'Something went wrong');
      setSavingRef(false);
    }
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

  const { check, education, employment, criminal, referrers } = data;
  const canEditInfo = ['invited', 'in_progress'].includes(check.status);
  const canAddReferrer = check.include_reference && referrers.length > 0;

  const checksRequested = [
    check.include_reference  && '📋 Reference Check',
    check.include_education  && '🎓 Education Verification',
    check.include_criminal   && '🔍 Criminal Check',
    check.include_employment && '💼 Employment Verification',
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
          <div className="text-right flex flex-col items-end gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[check.status]}`}>
              {STATUS_LABEL[check.status] || check.status}
            </span>
            {check.expires_at && (
              <div className="text-xs text-gray-400">
                Deadline: {new Date(check.expires_at).toLocaleDateString()}
              </div>
            )}
                    {canEditInfo && !editingInfo && (
              <button
                onClick={() => {
                  setEditForm({
                    candidateName: check.candidate_name,
                    candidateEmail: check.candidate_email,
                    targetRole: check.target_role || '',
                    includeReference:  check.include_reference,
                    includeEducation:  check.include_education,
                    includeCriminal:   check.include_criminal,
                    includeEmployment: check.include_employment,
                  });
                  setEditingInfo(true);
                }}
                className="text-xs text-teal-600 hover:underline font-medium">
                Edit details
              </button>
            )}
          </div>
        </div>

        {editingInfo && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Edit Candidate Details</h3>
            <form onSubmit={saveInfo} className="space-y-3">
              {infoError && <p className="text-sm text-red-500">{infoError}</p>}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input value={editForm.candidateName} onChange={e => setEditForm(f => ({ ...f, candidateName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input type="email" value={editForm.candidateEmail} onChange={e => setEditForm(f => ({ ...f, candidateEmail: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Target role</label>
                <input value={editForm.targetRole} onChange={e => setEditForm(f => ({ ...f, targetRole: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Checks to run</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    ['includeReference',  '📋 Reference Check'],
                    ['includeEducation',  '🎓 Education Verification'],
                    ['includeCriminal',   '🔍 Criminal Check'],
                    ['includeEmployment', '💼 Employment Verification'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!editForm[key]}
                        onChange={e => setEditForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="accent-teal-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {(editForm.candidateEmail    !== check.candidate_email    ||
                editForm.includeReference  !== check.include_reference  ||
                editForm.includeEducation  !== check.include_education  ||
                editForm.includeCriminal   !== check.include_criminal   ||
                editForm.includeEmployment !== check.include_employment) && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  The updated invite will be resent to the candidate with the latest details.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingInfo}
                  className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition">
                  {savingInfo ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setEditingInfo(false); setInfoError(''); }}
                  className="border border-gray-300 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {/* Reference checks */}
          {check.include_reference && (
            <section>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-800">📋 References</h2>
                {canAddReferrer && !addingRef && (
                  <button onClick={() => setAddingRef(true)}
                    className="text-xs text-teal-600 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition font-medium">
                    + Add Referee
                  </button>
                )}
              </div>

              {addingRef && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Add Additional Referee</h3>
                  <form onSubmit={saveReferrer} className="space-y-3">
                    {refError && <p className="text-sm text-red-500">{refError}</p>}
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Referee name *</label>
                        <input required value={refForm.name} onChange={e => setRefForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Jane Smith"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Referee email *</label>
                        <input required type="email" value={refForm.email} onChange={e => setRefForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="jane@company.com"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">An invite will be sent to this referee immediately.</p>
                    <div className="flex gap-2">
                      <button type="submit" disabled={savingRef}
                        className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition">
                        {savingRef ? 'Sending…' : 'Send Invite'}
                      </button>
                      <button type="button" onClick={() => { setAddingRef(false); setRefError(''); }}
                        className="border border-gray-300 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

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

          {/* Employment verification */}
          {check.include_employment && (
            <section>
              <h2 className="font-semibold text-gray-800 mb-1">💼 Employment Verification</h2>
              <p className="text-xs text-gray-400 mb-3">
                Call each employer to verify tenure and role, then record who you spoke with and any notes below.
              </p>
              {employment.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-6 text-center text-gray-400 text-sm">
                  {check.status === 'invited' || check.status === 'in_progress'
                    ? 'Waiting for candidate to submit employment history…'
                    : 'No employment entries submitted'}
                </div>
              ) : (
                <div className="space-y-3">
                  {employment.map(e => (
                    <EmploymentCard key={e.id} entry={e} onUpdated={updateEmploymentEntry} />
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
