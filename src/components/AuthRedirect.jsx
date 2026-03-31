import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthRedirect = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (user) {
    // Redirect authenticated users to their dashboard
    const dashboardPath = user.userType === 'applicant' ? '/applicant-dashboard' : '/recruiter-dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default AuthRedirect;