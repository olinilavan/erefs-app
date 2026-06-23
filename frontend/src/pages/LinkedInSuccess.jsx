/**
 * /auth/linkedin/success
 * Backend redirects here after a successful LinkedIn OAuth exchange.
 * Query params: ?token=JWT&user=JSON
 * This page reads them, logs the user in, and redirects to their dashboard.
 */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LinkedInSuccess() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!token || !userRaw) {
      navigate('/login?error=LinkedIn+sign-in+failed', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      loginWithToken(token, user);
      if (user.is_admin)           navigate('/admin',              { replace: true });
      else if (user.role === 'employer') navigate('/employer/dashboard', { replace: true });
      else                              navigate('/dashboard',          { replace: true });
    } catch {
      navigate('/login?error=LinkedIn+sign-in+failed', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Signing you in…
    </div>
  );
}
