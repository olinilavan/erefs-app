import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import AccountDropdown from '../components/AccountDropdown';
import { normalizeUrl } from '../utils/url';

export default function JobApplicants() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/api/employer/jobs/${id}/applicants`)
      .then(r => setData(r.data))
      .catch(() => setError(true));
  }, [id]);

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
            <h1 className="text-2xl font-bold mt-2 mb-1">{data.job.title}</h1>
            <p className="text-gray-500 text-sm mb-8">
              {data.applicants.length} applicant{data.applicants.length !== 1 ? 's' : ''}
            </p>

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
                      <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    {a.resume_url && (
                      <a href={normalizeUrl(a.resume_url)} target="_blank" rel="noopener noreferrer"
                        className="inline-block text-sm text-teal-600 hover:underline mt-2">
                        📄 View Resume →
                      </a>
                    )}
                    {a.message && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{a.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
