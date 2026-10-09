import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-100 max-w-6xl mx-auto w-full">
        <Logo to="/" height={100} />
        <div className="flex gap-4 text-sm">
          <Link to="/login" className="text-gray-500 hover:text-teal-700">Log in</Link>
          <Link to="/register" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition">Get Started Free</Link>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <p className="text-7xl font-bold text-teal-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-500 mb-8 max-w-sm">The page you're looking for doesn't exist or may have moved.</p>
        <div className="flex gap-4">
          <Link to="/" className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition">Go to homepage</Link>
          <Link to="/demo" className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition">Book a demo</Link>
        </div>
      </div>
    </div>
  );
}
