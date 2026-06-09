import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewReferral from './pages/NewReferral';
import ReferralDetail from './pages/ReferralDetail';
import Report from './pages/Report';
import PublicReport from './pages/PublicReport';
import ReferrerForm from './pages/ReferrerForm';
import EmployerDashboard from './pages/EmployerDashboard';

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ref/:token" element={<ReferrerForm />} />
        <Route path="/report/share/:shareToken" element={<PublicReport />} />

        {/* Job Seeker */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/references/new" element={<PrivateRoute><NewReferral /></PrivateRoute>} />
        <Route path="/references/:id" element={<PrivateRoute><ReferralDetail /></PrivateRoute>} />
        <Route path="/reports/:id" element={<PrivateRoute><Report /></PrivateRoute>} />

        {/* Employer */}
        <Route path="/employer/dashboard" element={<PrivateRoute role="employer"><EmployerDashboard /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}
