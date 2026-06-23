import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

function ContactForm({ vmId, onSent }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.post(`/api/employer/talent/${vmId}/contact`, { phone, message: message || undefined });
      onSent();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input type="tel" required placeholder="Your phone number" value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      <textarea rows={2} placeholder="Optional message" value={message}
        onChange={e => setMessage(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
      <button type="submit" disabled={sending}
        className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition disabled:opacity-50">
        {sending ? 'Sending…' : 'Send Request'}
      </button>
    </form>
  );
}

export default function PublicTalentDirectory() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [sentIds, setSentIds] = useState([]);

  useEffect(() => {
    setLoaded(false);
    api.get(`/api/talent?page=${page}`).then(r => {
      setCandidates(r.data.candidates);
      setTotalPages(r.data.totalPages);
      setLoaded(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [page]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="flex justify-between items-center px-8 py-5 max-w-6xl mx-auto border-b border-gray-100">
        <Logo to="/" height={100} />
        <div className="flex gap-3 items-center">
          {!user && (
            <>
              <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-teal-700 transition font-medium">Log in</Link>
              <Link to="/register" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition">Get Started Free</Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Available Talent Pool</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Job seekers who've opted in to be discoverable. Names and emails are never shown —
            reach out and we'll forward your contact info to them directly.
          </p>
        </div>

        {!loaded ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p>No candidates are currently open to employer contact.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {candidates.map(c => (
                <div key={c.vm_id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800">{c.headline}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{c.vm_id}</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ml-3 ${c.reference_complete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.reference_complete ? '✓ Reference Complete' : 'Reference Pending'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-3">
                    {c.years_experience != null && <span>💼 {c.years_experience} yr{c.years_experience !== 1 ? 's' : ''} experience</span>}
                    {c.location && <span>📍 {c.location}</span>}
                    {c.availability && <span>🕒 {c.availability}</span>}
                  </div>

                  {sentIds.includes(c.vm_id) ? (
                    <button disabled
                      className="mt-4 text-sm border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed w-full">
                      ✓ Request Sent
                    </button>
                  ) : !user ? (
                    <Link to="/register?role=employer"
                      className="mt-4 block text-center text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                      Log in as Employer to Reach Out
                    </Link>
                  ) : user.role !== 'employer' ? (
                    <button disabled title="Only employer accounts can contact candidates"
                      className="mt-4 text-sm border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed w-full">
                      Employer Accounts Only
                    </button>
                  ) : openId === c.vm_id ? (
                    <ContactForm vmId={c.vm_id} onSent={() => { setOpenId(null); setSentIds(ids => [...ids, c.vm_id]); }} />
                  ) : (
                    <button onClick={() => setOpenId(c.vm_id)}
                      className="mt-4 text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition w-full">
                      Reach Out
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
