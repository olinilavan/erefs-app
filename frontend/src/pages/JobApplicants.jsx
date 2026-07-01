import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import AccountDropdown from '../components/AccountDropdown';
import { normalizeUrl } from '../utils/url';

function fitColor(score) {
  if (score == null) return 'bg-gray-100 text-gray-500';
  if (score >= 75) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-600';
}

export default function JobApplicants() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [expandedResume, setExpandedResume] = useState(null);

  function load() {
    api.get(`/api/employer/jobs/${id}/applicants`)
      .then(r => setData(r.data))
      .catch(() => setError(true));
  }

  useEffect(() => { load(); }, [id]);

  async function runMatching() {
    setMatching(true);
    setMatchError('');
    try {
      const r = await api.post(`/api/employer/jobs/${id}/match-candidates`);
      setData(r.data);
    } catch (err) {
      setMatchError(err.response?.data?.error || 'Matching failed — please try again');
    } finally {
      setMatching(false);
    }
  }

  const hasAnyFitScore = data?.applicants.some(a => a.fit_score != null);

  async function updateSubmissionStatus(submissionId, status) {
    const r = await api.patch(`/api/employer/jobs/${id}/vendor-submissions/${submissionId}`, { status });
    setData(d => ({
      ...d,
      vendorSubmissions: d.vendorSubmissions.map(s => s.id === submissionId ? r.data : s),
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Logo to="/employer/dashboard" />
        <AccountDropdown />
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-10">
        <Link to="/employer/jobs" className="text-sm text-teal-600 hover:underline">← Job Postings</Link>

        {error ? (
          <div className="text-center py-20 text-gray-400">Not found.</div>
        ) : !data ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="flex justify-between items-start mt-2 mb-1">
              <h1 className="text-2xl font-bold">{data.job.title}</h1>
              {data.applicants.length > 0 && (
                <button onClick={runMatching} disabled={matching}
                  className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 whitespace-nowrap">
                  {matching ? 'Matching…' : hasAnyFitScore ? '🤖 Re-run Matching' : '🤖 Match Candidates'}
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mb-2">
              {data.applicants.length} applicant{data.applicants.length !== 1 ? 's' : ''}
            </p>
            {matchError && <p className="text-sm text-red-500 mb-4">{matchError}</p>}
            {hasAnyFitScore && (
              <p className="text-xs text-gray-400 mb-6">
                AI-suggested ranking based on resume/cover note text — advisory only, not a hiring decision.
              </p>
            )}

            {data.applicants.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">📭</div>
                <p>No applicants yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.applicants.map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{a.applicant_name}</div>
                        <div className="text-sm text-gray-400">{a.applicant_email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.fit_score != null && (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${fitColor(a.fit_score)}`}>
                            Fit: {a.fit_score}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 items-center">
                      {a.resume_url && (
                        <a href={normalizeUrl(a.resume_url)} target="_blank" rel="noopener noreferrer"
                          className="inline-block text-sm text-teal-600 hover:underline">
                          📄 View Resume Link →
                        </a>
                      )}
                      {a.resume_text && (
                        <button
                          onClick={() => setExpandedResume(expandedResume === a.id ? null : a.id)}
                          className="text-sm text-teal-600 hover:underline"
                        >
                          📄 {expandedResume === a.id ? 'Hide Resume Text ▲' : 'View Resume Text ▼'}
                        </button>
                      )}
                    </div>

                    {a.resume_text && expandedResume === a.id && (
                      <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1.5">
                          Extracted from the candidate's uploaded/pasted resume — plain text only, original formatting (columns, styling, layout) is not preserved.
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.resume_text}</p>
                      </div>
                    )}

                    {a.message && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{a.message}</p>
                    )}
                    {a.fit_rationale && (
                      <p className="text-sm text-gray-700 mt-2 bg-teal-50 rounded-lg px-3 py-2">{a.fit_rationale}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {data.vendorSubmissions?.length > 0 && (
              <div className="mt-10">
                <h2 className="font-semibold text-gray-800 mb-1">Vendor Submissions</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Candidates submitted by your approved vendors.
                </p>
                <div className="space-y-3">
                  {data.vendorSubmissions.map(s => (
                    <div key={s.id} className="bg-white rounded-xl border border-purple-100 px-5 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{s.candidate_name}</div>
                          <div className="text-sm text-gray-400">{s.candidate_email}{s.candidate_phone ? ` · ${s.candidate_phone}` : ''}</div>
                          <div className="text-xs text-purple-600 mt-0.5">via {s.vendor_company || s.vendor_name}</div>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>

                      {s.resume_text && (
                        <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.resume_text}</p>
                        </div>
                      )}
                      {s.cover_note && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{s.cover_note}</p>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700 capitalize">{s.status}</span>
                        <div className="flex gap-3">
                          {s.status !== 'shortlisted' && s.status !== 'hired' && (
                            <button onClick={() => updateSubmissionStatus(s.id, 'shortlisted')}
                              className="text-xs text-teal-600 hover:underline font-medium">Shortlist</button>
                          )}
                          {s.status !== 'rejected' && (
                            <button onClick={() => updateSubmissionStatus(s.id, 'rejected')}
                              className="text-xs text-red-500 hover:underline font-medium">Reject</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
