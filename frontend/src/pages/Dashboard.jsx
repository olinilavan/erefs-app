import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const statusColor = { pending: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get('/api/referrals').then(r => setRequests(r.data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-700">eRefs<span className="text-gray-400">.ai</span></Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">Logout</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your References</h1>
            <p className="text-gray-500 text-sm mt-1">Track and manage your referral requests</p>
          </div>
          <Link to="/references/new"
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            + New Request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p>No referral requests yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-6 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{r.target_role || 'General Reference'}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {r.completed_referrers}/{r.total_referrers} referrers completed
                    · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[r.status] || 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                  </span>
                  <Link to={`/references/${r.id}`}
                    className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
