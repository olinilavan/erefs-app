import Logo from '../components/Logo';
import LinkedInIcon from '../components/LinkedInIcon';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Register() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: params.get('role') || 'jobseeker',
    company: '', headline: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  async function handleGoogleSuccess({ credential }) {
    setError('');
    try {
      const result = await googleLogin(credential);
      if (result?.needsRole) return navigate('/auth/google/role', { state: { credential } });
      if (result.is_admin) navigate('/admin');
      else if (result.role === 'employer') navigate('/employer/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions to create an account.');
      return;
    }
    try {
      await api.post('/api/auth/register', { ...form, termsAccepted: true });
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
          <Logo to="/" />
          <div className="text-4xl mt-8 mb-4">📬</div>
          <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            We sent a verification link to <strong>{form.email}</strong>.<br />
            Click it to activate your account. The link expires in 24 hours.
          </p>
          <p className="text-xs text-gray-400">
            Didn't receive it?{' '}
            <button onClick={async (e) => {
              try {
                await api.post('/api/auth/resend-verification', { email: form.email });
                alert('Verification email resent.');
              } catch {
                alert('Failed to resend. Please try again.');
              }
            }} className="text-teal-600 hover:underline font-medium">
              Resend email
            </button>
          </p>
          <Link to="/login" className="block mt-6 text-sm text-teal-600 hover:underline">
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <Logo to="/" />
        <h1 className="text-2xl font-bold mt-6 mb-1">Create your account</h1>

        {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 mt-4">
          {['jobseeker', 'employer'].map(r => (
            <button key={r} type="button"
              onClick={() => setForm({ ...form, role: r })}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${form.role === r ? 'bg-white shadow text-teal-700' : 'text-gray-500'}`}>
              {r === 'jobseeker' ? 'Job Seeker' : 'Employer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full name" required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input type="email" placeholder="Email" required value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <div>
            <input type="password" placeholder="Password" required minLength={8} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            {form.password && form.password.length < 8 && (
              <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters.</p>
            )}
          </div>
          {form.role === 'jobseeker' && (
            <input type="text" placeholder="Professional headline (e.g. Senior Engineer)" value={form.headline}
              onChange={e => setForm({ ...form, headline: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          )}
          {form.role === 'employer' && (
            <input type="text" placeholder="Company name" value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          )}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="text-teal-600 hover:underline font-medium">
                Terms & Conditions
              </Link>
            </span>
          </label>
          <button type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50"
            disabled={!termsAccepted}>
            Create Account
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-in failed')} width="368" />
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = '/api/auth/linkedin'; }}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <LinkedInIcon />
            Sign up with LinkedIn
          </button>
        </div>

        <p className="mt-4 text-center text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-teal-600 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
