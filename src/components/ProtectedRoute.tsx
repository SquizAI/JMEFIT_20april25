import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading, emailVerified } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-jme-purple"></div>
      </div>
    );
  }

  // Require email verification for protected routes
  if (user && !emailVerified && !adminOnly) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Email Verification Required</h2>
          <p className="text-gray-600 mb-6">
            Please verify your email address to access this page. Check your inbox for the verification link.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-jme-purple text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Redirect to regular auth for non-admin protected routes
  if (!user) {
    return <Navigate 
      to={adminOnly ? "/admin/login" : "/auth"} 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check admin role for admin routes
  if (adminOnly && user.user_metadata?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute