import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import EmployerNav from '../components/EmployerNav';
import Tooltip from '../components/Tooltip';

const LINK_STATUS_BADGE = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-gray-100 text-gray-500',
  revoked:  'bg-red-100 text-red-600',
};

export default function EmployerVendorNetwork() {
  const [directory, setDirectory] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [links, setLinks] = useState([]);
  const [tab, setTab] = useState('links');
  const [requesting, setRequesting] = useState({});

  function loadAll() {
    api.get('/api/employer/vendors/directory').then(r => setDirectory(r.data));
    api.get('/api/employer/vendors/incoming').then(r => setIncoming(r.data));
    api.get('/api/employer/vendors/links').then(r => setLinks(r.data));
  }

  useEffect(() => { loadAll(); }, []);

  async function sendRequest(buyerEmployerId) {
    setRequesting({ ...requesting, [buyerEmployerId]: true });
    try {
      await api.post('/api/employer/vendors/request', { buyerEmployerId });
      loadAll();
    } finally {
      setRequesting({ ...requesting, [buyerEmployerId]: false });
    }
  }

  async function approve(id) {
    await api.post(`/api/employer/vendors/${id}/approve`);
    loadAll();
  }

  async function decline(id) {
    await api.post(`/api/employer/vendors/${id}/decline`);
    loadAll();
  }

  async function revoke(id) {
    await api.delete(`/api/employer/vendors/links/${id}`);
    loadAll();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNav />

      <main className="max-w-4xl mx-auto px-8 py-10">
        <Link to="/employer/dashboard" className="text-sm text-teal-600 hover:underline">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Vendor Network</h1>
        <p className="text-gray-500 text-sm mb-8">
          Request to become another employer's vendor, or approve vendors who want to supply candidates for your job postings.
        </p>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 max-w-md">
          {[
            ['links', 'My Links'],
            ['directory', 'Find Employers'],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === key ? 'bg-white shadow text-teal-700' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'links' && (
          <div className="space-y-6">
            {incoming.length > 0 && (
              <div className="bg-white rounded-2xl border border-yellow-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-yellow-100 bg-yellow-50 text-sm font-semibold text-gray-700">
                  Incoming Vendor Requests
                </div>
                <div className="divide-y divide-gray-50">
                  {incoming.map(r => (
                    <div key={r.id} className="px-5 py-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm text-gray-800">{r.vendor_company || r.vendor_name}</div>
                        <div className="text-xs text-gray-400">{r.vendor_email}</div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => decline(r.id)} className="text-xs text-gray-500 hover:text-red-600 font-medium">Decline</button>
                        <button onClick={() => approve(r.id)}
                          className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 font-medium">Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
                Active &amp; Past Links
              </div>
              <div className="divide-y divide-gray-50">
                {links.map(l => (
                  <div key={l.id} className="px-5 py-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        {l.buyer_company || l.buyer_name} ← {l.vendor_company || l.vendor_name}
                      </div>
                      <div className="text-xs text-gray-400">Vendor supplies candidates to Buyer</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LINK_STATUS_BADGE[l.status]}`}>{l.status}</span>
                      {l.status === 'approved' && (
                        <button onClick={() => revoke(l.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Revoke</button>
                      )}
                    </div>
                  </div>
                ))}
                {links.length === 0 && (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">No links yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'directory' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              Other Employers — request to become their vendor
            </div>
            <div className="divide-y divide-gray-50">
              {directory.map(e => (
                <div key={e.id} className="px-5 py-4 flex justify-between items-center">
                  <div className="font-medium text-sm text-gray-800">{e.company || e.name}</div>
                  {e.link_status ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LINK_STATUS_BADGE[e.link_status]}`}>{e.link_status}</span>
                  ) : (
                    <Tooltip text="Once approved, their job postings will appear under Vendor Jobs and you can submit candidates directly.">
                      <button onClick={() => sendRequest(e.id)} disabled={requesting[e.id]}
                        className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50">
                        {requesting[e.id] ? 'Sending…' : 'Request to be their Vendor'}
                      </button>
                    </Tooltip>
                  )}
                </div>
              ))}
              {directory.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">No other employers yet</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
