import Logo from '../components/Logo';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    try {
      const user = await login(form.email, form.password);
      if (user.is_admin) navigate('/admin');
      else if (user.role === 'employer') navigate('/employer/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true);
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }
  };

  async function resendVerification() {
    try {
      await api.post('/api/auth/resend-verification', { email: form.email });
      setResent(true);
    } catch {
      setError('Failed to resend verification email. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <Logo to="/" />
        <h1 className="text-2xl font-bold mt-6 mb-1">Welcome back</h1>
        <p className="text-gray-500 mb-6">Log in to your account</p>

        {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        {unverified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
            <p className="font-medium mb-1">Please verify your email first.</p>
            <p className="text-xs text-yellow-700 mb-2">Check your inbox for the verification link.</p>
            {resent ? (
              <p className="text-xs text-green-700 font-medium">✓ Verification email resent.</p>
            ) : (
              <button onClick={resendVerification} className="text-xs text-teal-700 font-medium hover:underline">
                Resend verification email →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" required value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <div>
            <input type="password" placeholder="Password" required value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <div className="text-right mt-1">
              <Link to="/forgot-password" className="text-sm text-teal-600 hover:underline">Forgot password?</Link>
            </div>
          </div>
          <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
            Log In
          </button>
        </form>

        <p className="mt-4 text-center text-gray-500 text-sm">
          Don't have an account? <Link to="/register" className="text-teal-600 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
