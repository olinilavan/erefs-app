import Logo from '../components/Logo';
import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <Logo to="/" />

        {done ? (
          <div className="mt-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">Password updated</h2>
            <p className="text-gray-500 text-sm">Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mt-6 mb-1">Set a new password</h1>
            <p className="text-gray-500 text-sm mb-6">Must be at least 8 characters.</p>

            {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password" required placeholder="New password" minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="password" required placeholder="Confirm new password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${confirm && password !== confirm ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-500'}`}
              />
              {confirm && password !== confirm && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
              <button type="submit" disabled={loading || (confirm && password !== confirm)}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50">
                {loading ? 'Updating…' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
