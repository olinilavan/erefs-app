import Logo from '../components/Logo';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleRoleSelect() {
  const { googleLogin } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [role, setRole] = useState('jobseeker');
  const [company, setCompany] = useState('');
  const [headline, setHeadline] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const credential = state?.credential;

  if (!credential) {
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
      const user = await googleLogin(credential, { role, company, headline, termsAccepted: true });
      if (user.is_admin) navigate('/admin');
      else if (user.role === 'employer') navigate('/employer/dashboard');
      else navigate('/dashboard');
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
        <h1 className="text-2xl font-bold mt-6 mb-1">One last step</h1>
        <p className="text-gray-500 mb-6 text-sm">Tell us how you'll be using VouchMetrics.</p>

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
            <input type="text" placeholder="Professional headline (e.g. Senior Engineer)" value={headline}
              onChange={e => setHeadline(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          )}
          {role === 'employer' && (
            <input type="text" placeholder="Company name" value={company}
              onChange={e => setCompany(e.target.value)}
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

          <button type="submit" disabled={!termsAccepted || loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50">
            {loading ? 'Creating account…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
