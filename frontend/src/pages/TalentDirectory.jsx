import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import AccountDropdown from '../components/AccountDropdown';
import Pagination from '../components/Pagination';

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

export default function TalentDirectory() {
  const [candidates, setCandidates] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  function load() {
    api.get(`/api/employer/talent?page=${page}`).then(r => {
      setCandidates(r.data.candidates);
      setTotalPages(r.data.totalPages);
      setLoaded(true);
    });
  }

  useEffect(() => { load(); }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Logo to="/employer/dashboard" />
        <AccountDropdown />
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-8">
          <Link to="/employer/dashboard" className="text-sm text-teal-600 hover:underline">← Candidate Pipeline</Link>
          <h1 className="text-2xl font-bold mt-2">Talent Directory</h1>
          <p className="text-gray-500 text-sm mt-1">
            Job seekers who've opted in to be discoverable. Names and emails are never shown — reach out and we'll forward your contact info to them.
          </p>
        </div>

        {!loaded ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
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

                {c.already_contacted ? (
                  <button disabled
                    className="mt-4 text-sm border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed w-full">
                    Already Contacted
                  </button>
                ) : openId === c.vm_id ? (
                  <ContactForm vmId={c.vm_id} onSent={() => { setOpenId(null); load(); }} />
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
