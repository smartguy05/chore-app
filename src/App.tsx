import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import LoginPage from './pages/LoginPage';
import ParentDashboard from './pages/ParentDashboard';
import KidDashboard from './pages/KidDashboard';
import MagicLinkPage from './pages/MagicLinkPage';

// Components
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode; userType?: 'parent' | 'kid' }> = ({ 
  children, 
  userType 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userType && user.type !== userType) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route path="/auth/magic-link" element={<MagicLinkPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          {user?.type === 'parent' ? <ParentDashboard /> : <KidDashboard />}
        </ProtectedRoute>
      } />
      <Route path="/parent/*" element={
        <ProtectedRoute userType="parent">
          <ParentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/kid/*" element={
        <ProtectedRoute userType="kid">
          <KidDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 