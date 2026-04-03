import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { PageLoader } from './components/ui/LoadingSpinner';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Donor Pages
import DonorDashboard from './pages/donor/DonorDashboard';
import CreateListing from './pages/donor/CreateListing';
import MyListings from './pages/donor/MyListings';
import ListingDetail from './pages/donor/ListingDetail';

// NGO Pages
import NgoDashboard from './pages/ngo/NgoDashboard';
import LiveFeed from './pages/ngo/LiveFeed';
import MyClaims from './pages/ngo/MyClaims';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ListingModeration from './pages/admin/ListingModeration';
import ClaimAllocation from './pages/admin/ClaimAllocation';
import ComplaintSystem from './pages/admin/ComplaintSystem';

const getRoleHomeRoute = (role) => {
  const roleRoutes = {
    admin: '/admin',
    donor: '/donor',
    ngo: '/ngo',
    buyer: '/unauthorized',
  };

  return roleRoutes[role] || '/login';
};

const App = () => {
  const { fetchUser, isLoading, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass',
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            color: '#0f172a',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(255,255,255,0.5)',
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to={getRoleHomeRoute(user?.role)} replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to={getRoleHomeRoute(user?.role)} replace /> : <RegisterPage />} />

          <Route path="/" element={<Navigate to={isAuthenticated ? getRoleHomeRoute(user?.role) : '/login'} replace />} />

          {/* Protected Routes inside Layout */}
          <Route element={<MainLayout />}>
            
            {/* Donor Routes */}
            <Route path="/donor" element={<ProtectedRoute roles={['donor', 'admin']}><DonorDashboard /></ProtectedRoute>} />
            <Route path="/donor/create" element={<ProtectedRoute roles={['donor', 'admin']}><CreateListing /></ProtectedRoute>} />
            <Route path="/donor/listings" element={<ProtectedRoute roles={['donor', 'admin']}><MyListings /></ProtectedRoute>} />
            <Route path="/donor/listings/:id" element={<ProtectedRoute roles={['donor', 'admin']}><ListingDetail /></ProtectedRoute>} />

            {/* NGO Routes */}
            <Route path="/ngo" element={<ProtectedRoute roles={['ngo', 'admin']}><NgoDashboard /></ProtectedRoute>} />
            <Route path="/ngo/live" element={<ProtectedRoute roles={['ngo', 'admin']}><LiveFeed /></ProtectedRoute>} />
            <Route path="/ngo/live/:id" element={<ProtectedRoute roles={['ngo', 'admin']}><ListingDetail /></ProtectedRoute>} /> {/* Reusing detail page */}
            <Route path="/ngo/claims" element={<ProtectedRoute roles={['ngo', 'admin']}><MyClaims /></ProtectedRoute>} />


            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/listings" element={<ProtectedRoute roles={['admin']}><ListingModeration /></ProtectedRoute>} />
            <Route path="/admin/claims" element={<ProtectedRoute roles={['admin']}><ClaimAllocation /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute roles={['admin']}><ComplaintSystem /></ProtectedRoute>} />

          </Route>
          
          <Route path="/unauthorized" element={
            <div className="flex h-screen items-center justify-center bg-surface-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-surface-900 mb-2">403</h1>
                <p className="text-surface-500 mb-6">You are not authorized to access this page.</p>
                <a href="/" className="text-primary-600 hover:text-primary-700 font-medium">Go back home</a>
              </div>
            </div>
          } />

        </Routes>
      </Router>
    </>
  );
};

export default App;
