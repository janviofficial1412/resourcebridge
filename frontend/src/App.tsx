import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ActiveMembershipRoute } from './components/layout/ActiveMembershipRoute';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { InstitutionDetailPage } from './pages/InstitutionDetailPage';
import { MyResourcesPage } from './pages/MyResourcesPage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { IncomingBookingsPage } from './pages/IncomingBookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Loader } from './components/ui/Loader';

// Redirects authenticated users away from login/register to dashboard
const PublicOnlyRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <Loader fullScreen label="Checking session..." />;
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return element;
};

const AuthStatusMessage: React.FC = () => {
  const { authError } = useAuth();
  if (!authError) return null;
  return (
    <div role="alert" className="mx-auto mt-4 max-w-7xl rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      {authError}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthStatusMessage />
      <Routes>
        {/* Public Marketing Layout */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<PublicOnlyRoute element={<LoginPage />} />} />
          <Route path="register" element={<PublicOnlyRoute element={<RegisterPage />} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Authenticated application routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="institutions" element={<InstitutionsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route element={<ActiveMembershipRoute />}>
              <Route path="discover" element={<DiscoverPage />} />
              <Route path="institutions/:id" element={<InstitutionDetailPage />} />
              <Route path="my-resources" element={<MyResourcesPage />} />
              <Route path="resources/:id" element={<ResourceDetailPage />} />
              <Route path="bookings" element={<MyBookingsPage />} />
              <Route path="bookings/incoming" element={<IncomingBookingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
