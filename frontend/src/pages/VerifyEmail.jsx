import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    api.get(`/api/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md text-center">
        <Logo to="/" />

        {status === 'verifying' && (
          <div className="mt-8">
            <div className="text-3xl mb-4 animate-pulse">⏳</div>
            <p className="text-gray-500">Verifying your email…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold mb-2">Email verified!</h2>
            <p className="text-gray-500 text-sm mb-6">Your account is now active. You can log in.</p>
            <Link to="/login"
              className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition">
              Log in →
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold mb-2">Link invalid or expired</h2>
            <p className="text-gray-500 text-sm mb-6">
              Verification links expire after 24 hours. Register again to get a new one.
            </p>
            <Link to="/register"
              className="inline-block border-2 border-teal-200 text-teal-700 px-6 py-3 rounded-xl font-semibold hover:bg-teal-50 transition">
              Register again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
