import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login page
    const loginPath = requiredUserType === 'applicant' ? '/applicant-login' : '/recruiter-login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (user.userType !== requiredUserType) {
    // Redirect to correct dashboard if user type doesn't match
    const correctDashboard = user.userType === 'applicant' ? '/applicant-dashboard' : '/recruiter-dashboard';
    return <Navigate to={correctDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;