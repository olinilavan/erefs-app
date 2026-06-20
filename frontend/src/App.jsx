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
import SampleReport from './pages/SampleReport';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import GoogleRoleSelect from './pages/GoogleRoleSelect';

function PrivateRoute({ children, role, adminOnly }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" />;
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/ref/:token" element={<ReferrerForm />} />
        <Route path="/report/share/:shareToken" element={<PublicReport />} />
        <Route path="/sample-report" element={<SampleReport />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/auth/google/role" element={<GoogleRoleSelect />} />

        {/* Job Seeker */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/references/new" element={<PrivateRoute><NewReferral /></PrivateRoute>} />
        <Route path="/references/:id" element={<PrivateRoute><ReferralDetail /></PrivateRoute>} />
        <Route path="/reports/:id" element={<PrivateRoute><Report /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* Employer */}
        <Route path="/employer/dashboard" element={<PrivateRoute role="employer"><EmployerDashboard /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}
