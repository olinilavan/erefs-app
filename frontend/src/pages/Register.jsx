import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: params.get('role') || 'jobseeker',
    company: '', headline: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions to create an account.');
      return;
    }
    try {
      const user = await register({ ...form, termsAccepted: true });
      navigate(user.role === 'employer' ? '/employer/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <Link to="/" className="text-xl font-bold text-indigo-700">eRefs<span className="text-gray-400">.ai</span></Link>
        <h1 className="text-2xl font-bold mt-6 mb-1">Create your account</h1>

        {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        {/* Role toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 mt-4">
          {['jobseeker', 'employer'].map(r => (
            <button key={r} type="button"
              onClick={() => setForm({ ...form, role: r })}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${form.role === r ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}>
              {r === 'jobseeker' ? 'Job Seeker' : 'Employer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full name" required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="email" placeholder="Email" required value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div>
            <input type="password" placeholder="Password" required minLength={8} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {form.password && form.password.length < 8 && (
              <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters.</p>
            )}
          </div>
          {form.role === 'jobseeker' && (
            <input type="text" placeholder="Professional headline (e.g. Senior Engineer)" value={form.headline}
              onChange={e => setForm({ ...form, headline: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          )}
          {form.role === 'employer' && (
            <input type="text" placeholder="Company name" value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          )}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="text-indigo-600 hover:underline font-medium">
                Terms & Conditions
              </Link>
            </span>
          </label>
          <button type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            disabled={!termsAccepted}>
            Create Account
          </button>
        </form>

        <p className="mt-4 text-center text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
