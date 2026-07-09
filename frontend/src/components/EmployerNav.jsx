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
    <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <Logo to="/employer/dashboard" />
      <div className="flex items-center gap-5">
        {NAV_LINKS.map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm font-medium transition ${
              exact ? pathname === to : pathname === to || pathname.startsWith(to)
                ? 'text-teal-600'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            {label}
          </Link>
        ))}
        <AccountDropdown />
      </div>
    </nav>
  );
}
