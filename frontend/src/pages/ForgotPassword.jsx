import Logo from '../components/Logo';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <Logo to="/" />

        {submitted ? (
          <div className="mt-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              If an account with <strong>{email}</strong> exists, you'll receive a reset link shortly. The link expires in 30 minutes.
            </p>
            <Link to="/login" className="mt-6 inline-block text-teal-600 text-sm font-medium hover:underline">
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mt-6 mb-1">Forgot your password?</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

            {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" required placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button type="submit" disabled={loading}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Remember it? <Link to="/login" className="text-teal-600 font-medium hover:underline">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
