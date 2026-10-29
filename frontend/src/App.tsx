import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
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

// Renders AuthenticatedLayout if user is signed in, otherwise public AppLayout
const AdaptiveAppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedLayout /> : <AppLayout />;
};

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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Marketing Layout */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<PublicOnlyRoute element={<LoginPage />} />} />
          <Route path="register" element={<PublicOnlyRoute element={<RegisterPage />} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Dual-Mode Routes (Public or Authenticated depending on session) */}
        <Route element={<AdaptiveAppLayout />}>
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="institutions" element={<InstitutionsPage />} />
        </Route>

        {/* Strictly Protected Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="institutions/:id" element={<InstitutionDetailPage />} />
            <Route path="my-resources" element={<MyResourcesPage />} />
            <Route path="resources/:id" element={<ResourceDetailPage />} />
            <Route path="bookings" element={<MyBookingsPage />} />
            <Route path="bookings/incoming" element={<IncomingBookingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
