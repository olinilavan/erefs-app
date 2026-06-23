/**
 * /auth/linkedin/role
 * Shown to brand-new LinkedIn users who need to pick a role before
 * their account is created.  Profile data arrives as a base64url param.
 */
import Logo from '../components/Logo';
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function LinkedInRoleSelect() {
  const [params] = useSearchParams();
  const profile = params.get('profile');   // base64url-encoded JSON from backend
  const navigate  = useNavigate();
  const { loginWithToken } = useAuth();

  const [role,          setRole]          = useState('jobseeker');
  const [company,       setCompany]       = useState('');
  const [headline,      setHeadline]      = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);

  if (!profile) {
    navigate('/login', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions to create an account.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/linkedin/complete', {
        profile,
        role,
        company:       company   || undefined,
        headline:      headline  || undefined,
        termsAccepted: true,
      });
      const { token, user } = res.data;
      loginWithToken(token, user);
      if (user.is_admin)             navigate('/admin',               { replace: true });
      else if (user.role === 'employer') navigate('/employer/dashboard',  { replace: true });
      else                               navigate('/dashboard',           { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <Logo to="/" />
        <h1 className="text-2xl font-bold mt-6 mb-1">One last step</h1>
        <p className="text-gray-500 mb-6 text-sm">Tell us how you'll be using this platform.</p>

        {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['jobseeker', 'employer'].map(r => (
              <button key={r} type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${role === r ? 'bg-white shadow text-teal-700' : 'text-gray-500'}`}>
                {r === 'jobseeker' ? 'Job Seeker' : 'Employer'}
              </button>
            ))}
          </div>

          {role === 'jobseeker' && (
            <input type="text" placeholder="Professional headline (e.g. Senior Engineer)"
              value={headline} onChange={e => setHeadline(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          )}
          {role === 'employer' && (
            <input type="text" placeholder="Company name"
              value={company} onChange={e => setCompany(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          )}

          {/* LinkedIn data notice */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">What we retrieve from LinkedIn:</p>
            <p>✓ Name, email address, profile photo</p>
            <p className="text-blue-500">✗ Work history & connections — requires LinkedIn Partner API access (not yet enabled)</p>
          </div>

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

          <button type="submit" disabled={!termsAccepted || loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50">
            {loading ? 'Creating account…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
