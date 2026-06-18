import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-gray-700 leading-tight">
            {user?.role === 'employer' && user?.company ? user.company : user?.name}
          </div>
          <div className="text-xs text-gray-400 leading-tight">
            {user?.role === 'employer' && user?.company ? user.name : user?.email}
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <span>⚙️</span> Account Settings
          </Link>
          <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed">
            <span>💳</span> Billing <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
          </div>
          <div className="border-t border-gray-100 mt-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
            >
              <span>→</span> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
