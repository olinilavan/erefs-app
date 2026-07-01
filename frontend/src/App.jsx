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
import CombinedReport from './pages/CombinedReport';
import ReferrerForm from './pages/ReferrerForm';
import CandidateProfile from './pages/CandidateProfile';
import EmployerDashboard from './pages/EmployerDashboard';
import TalentDirectory from './pages/TalentDirectory';
import PublicTalentDirectory from './pages/PublicTalentDirectory';
import OpenRoles from './pages/OpenRoles';
import EmployerJobs from './pages/EmployerJobs';
import JobApplicants from './pages/JobApplicants';
import SampleReport from './pages/SampleReport';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import AdminDashboard from './pages/AdminDashboard';
import EmployerVendorNetwork from './pages/EmployerVendorNetwork';
import EmployerVendorJobs from './pages/EmployerVendorJobs';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import GoogleRoleSelect from './pages/GoogleRoleSelect';
import LinkedInSuccess from './pages/LinkedInSuccess';
import LinkedInRoleSelect from './pages/LinkedInRoleSelect';

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
        <Route path="/candidate/:token" element={<CandidateProfile />} />
        <Route path="/report/share/:shareToken" element={<PublicReport />} />
        <Route path="/referrals/share/:shareToken" element={<CombinedReport />} />
        <Route path="/sample-report" element={<SampleReport />} />
        <Route path="/talent" element={<PublicTalentDirectory />} />
        <Route path="/jobs" element={<OpenRoles />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/auth/google/role"     element={<GoogleRoleSelect />} />
        <Route path="/auth/linkedin/success" element={<LinkedInSuccess />} />
        <Route path="/auth/linkedin/role"    element={<LinkedInRoleSelect />} />

        {/* Job Seeker */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/references/new" element={<PrivateRoute><NewReferral /></PrivateRoute>} />
        <Route path="/references/:id" element={<PrivateRoute><ReferralDetail /></PrivateRoute>} />
        <Route path="/reports/:id" element={<PrivateRoute><Report /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* Employer */}
        <Route path="/employer/dashboard" element={<PrivateRoute role="employer"><EmployerDashboard /></PrivateRoute>} />
        <Route path="/employer/talent" element={<PrivateRoute role="employer"><TalentDirectory /></PrivateRoute>} />
        <Route path="/employer/jobs" element={<PrivateRoute role="employer"><EmployerJobs /></PrivateRoute>} />
        <Route path="/employer/jobs/:id/applicants" element={<PrivateRoute role="employer"><JobApplicants /></PrivateRoute>} />
        <Route path="/employer/vendor-network" element={<PrivateRoute role="employer"><EmployerVendorNetwork /></PrivateRoute>} />
        <Route path="/employer/vendor-jobs" element={<PrivateRoute role="employer"><EmployerVendorJobs /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}
