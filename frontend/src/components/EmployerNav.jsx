import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import AccountDropdown from './AccountDropdown';

const NAV_LINKS = [
  { to: '/employer/dashboard',      label: 'Hiring',             exact: true },
  { to: '/employer/talent',         label: '🔍 Talent Directory' },
  { to: '/employer/jobs',           label: '📋 Job Postings' },
  { to: '/employer/vendor-network', label: '🤝 Vendor Network' },
  { to: '/employer/vendor-jobs',    label: '🔗 Vendor Jobs' },
];

export default function EmployerNav() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200">
      {/* Top row: logo + account */}
      <div className="flex justify-between items-center px-4 md:px-8 py-3 md:py-0 md:hidden">
        <Logo to="/employer/dashboard" />
        <AccountDropdown />
      </div>
      {/* Mobile: scrollable link strip */}
      <div className="flex overflow-x-auto gap-1 px-4 pb-2 md:hidden scrollbar-hide">
        {NAV_LINKS.map(({ to, label, exact }) => (
          <Link key={to} to={to}
            className={`text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-full transition flex-shrink-0 ${
              (exact ? pathname === to : pathname === to || pathname.startsWith(to))
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-500 hover:text-teal-600'
            }`}>
            {label}
          </Link>
        ))}
      </div>
      {/* Desktop: single row */}
      <div className="hidden md:flex justify-between items-center px-8 py-4">
        <Logo to="/employer/dashboard" />
        <div className="flex items-center gap-5">
          {NAV_LINKS.map(({ to, label, exact }) => (
            <Link key={to} to={to}
              className={`text-sm font-medium transition ${
                (exact ? pathname === to : pathname === to || pathname.startsWith(to))
                  ? 'text-teal-600'
                  : 'text-gray-600 hover:text-teal-600'
              }`}>
              {label}
            </Link>
          ))}
          <AccountDropdown />
        </div>
      </div>
    </nav>
  );
}
