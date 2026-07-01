import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import AccountDropdown from '../components/AccountDropdown';

function SubmitForm({ job, onSubmitted, onCancel }) {
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('candidateName', candidateName);
      formData.append('candidateEmail', candidateEmail);
      if (candidatePhone) formData.append('candidatePhone', candidatePhone);
      if (coverNote) formData.append('coverNote', coverNote);
      if (resumeFile) formData.append('resume', resumeFile);

      await api.post(`/api/employer/vendors/jobs/${job.id}/submissions`, formData);
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit candidate');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-teal-50 border border-teal-100 rounded-xl p-5 mt-3 space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid md:grid-cols-2 gap-3">
        <input type="text" placeholder="Candidate name" required value={candidateName}
          onChange={e => setCandidateName(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
        <input type="email" placeholder="Candidate email" required value={candidateEmail}
          onChange={e => setCandidateEmail(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      <input type="text" placeholder="Candidate phone (optional)" value={candidatePhone}
        onChange={e => setCandidatePhone(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      <textarea rows={2} placeholder="Cover note (optional)" value={coverNote}
        onChange={e => setCoverNote(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      <div>
        <label className="block text-xs text-gray-500 mb-1">Resume (.pdf, .doc, .docx)</label>
        <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files[0] || null)}
          className="text-sm" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50">
          {saving ? 'Submitting…' : 'Submit Candidate'}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function EmployerVendorJobs() {
  const [jobs, setJobs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openJobId, setOpenJobId] = useState(null);

  function load() {
    api.get('/api/employer/vendors/jobs').then(r => {
      setJobs(r.data);
      setLoaded(true);
    });
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Logo to="/employer/dashboard" />
        <AccountDropdown />
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <Link to="/employer/dashboard" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Vendor Jobs</h1>
        <p className="text-gray-500 text-sm mb-8">
          Job postings from employers who have approved you as a vendor. Submit candidates directly against any of them.
        </p>

        {!loaded ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔗</div>
            <p>No vendor jobs yet — once an employer approves you as their vendor, their postings will show up here.</p>
            <Link to="/employer/vendor-network" className="text-teal-600 hover:underline text-sm mt-3 inline-block">
              Manage Vendor Network →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{job.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.is_public ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {job.is_public ? 'Open to Public' : 'Vendor Only'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{job.company}</div>
                    {job.location && <div className="text-xs text-gray-400 mt-0.5">{job.location}</div>}
                  </div>
                  {job.already_submitted ? (
                    <span className="text-xs text-gray-400">Already submitted</span>
                  ) : (
                    <button onClick={() => setOpenJobId(openJobId === job.id ? null : job.id)}
                      className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 font-medium">
                      {openJobId === job.id ? 'Cancel' : 'Submit Candidate'}
                    </button>
                  )}
                </div>
                {job.description && <p className="text-sm text-gray-600 mt-2">{job.description}</p>}
                {openJobId === job.id && (
                  <SubmitForm job={job} onSubmitted={() => { setOpenJobId(null); load(); }} onCancel={() => setOpenJobId(null)} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
