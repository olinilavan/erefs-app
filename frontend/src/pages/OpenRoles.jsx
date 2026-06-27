import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import AccountDropdown from '../components/AccountDropdown';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

function ApplyForm({ jobId, onSent }) {
  const [message, setMessage] = useState('');
  const [resumeMode, setResumeMode] = useState('none'); // none | upload | paste
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const formData = new FormData();
      if (message) formData.append('message', message);
      if (resumeMode === 'upload' && resumeFile) formData.append('resume', resumeFile);
      if (resumeMode === 'paste' && resumeText) formData.append('resumeText', resumeText);
      await api.post(`/api/jobs/${jobId}/apply`, formData);
      onSent();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <textarea rows={2} placeholder="Optional note to the employer" value={message}
        onChange={e => setMessage(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />

      <select value={resumeMode} onChange={e => setResumeMode(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
        <option value="none">Don't include a resume</option>
        <option value="upload">Upload a resume file (.pdf, .doc, .docx)</option>
        <option value="paste">Paste my resume text</option>
      </select>

      {resumeMode === 'upload' && (
        <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files[0])}
          className="w-full text-sm" />
      )}
      {resumeMode === 'paste' && (
        <textarea rows={5} placeholder="Paste your resume text here" value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      )}

      <p className="text-xs text-gray-400">Your name, email, and resume (if provided) will be shared with this employer.</p>
      <button type="submit" disabled={sending}
        className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50">
        {sending ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  );
}

export default function OpenRoles() {
  const { user } = useAuth();
  const dashboardPath = user?.is_admin ? '/admin' : user?.role === 'employer' ? '/employer/dashboard' : '/dashboard';
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [sentIds, setSentIds] = useState([]);

  function load() {
    setLoaded(false);
    api.get(`/api/jobs?page=${page}`).then(r => {
      setJobs(r.data.jobs);
      setTotalPages(r.data.totalPages);
      setLoaded(true);
    });
  }

  useEffect(() => { load(); }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Logo to={user ? dashboardPath : '/'} />
        {user ? (
          <AccountDropdown />
        ) : (
          <div className="flex gap-3 items-center">
            <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-teal-700 transition font-medium">Log in</Link>
            <Link to="/register" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition">Get Started Free</Link>
          </div>
        )}
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-1">Open Roles</h1>
        <p className="text-gray-500 text-sm mb-8">
          Job openings posted by employers on VouchMetrics.
          {user?.role === 'employer' && ' As an employer, you can browse but not apply.'}
        </p>

        {!loaded ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p>No open roles posted right now.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800">{job.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{job.company}</div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-3">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-3">
                    {job.location && <span>📍 {job.location}</span>}
                    {job.work_requirement && <span>🪪 {job.work_requirement}</span>}
                  </div>

                  {job.description && <p className="text-sm text-gray-600 mt-3">{job.description}</p>}

                  {job.already_applied || sentIds.includes(job.id) ? (
                    <button disabled
                      className="mt-4 text-sm border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed">
                      ✓ Applied
                    </button>
                  ) : !user ? (
                    <Link to="/register?role=jobseeker"
                      className="mt-4 inline-block text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                      Log in to Apply
                    </Link>
                  ) : user.role !== 'jobseeker' ? (
                    <button disabled title="Only job seeker accounts can apply"
                      className="mt-4 text-sm border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed">
                      Job Seekers Only
                    </button>
                  ) : openId === job.id ? (
                    <ApplyForm jobId={job.id} onSent={() => { setOpenId(null); setSentIds(ids => [...ids, job.id]); }} />
                  ) : (
                    <button onClick={() => setOpenId(job.id)}
                      className="mt-4 text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </main>
    </div>
  );
}
