import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
import LandingPage from './pages/LandingPage';
import ApplicantDashboard from './pages/ApplicantDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/applicant-login" element={
                <AuthRedirect>
                  <Login userType="applicant" />
                </AuthRedirect>
              } />
              <Route path="/recruiter-login" element={
                <AuthRedirect>
                  <Login userType="recruiter" />
                </AuthRedirect>
              } />
              <Route path="/applicant-signup" element={
                <AuthRedirect>
                  <Signup userType="applicant" />
                </AuthRedirect>
              } />
              <Route path="/recruiter-signup" element={
                <AuthRedirect>
                  <Signup userType="recruiter" />
                </AuthRedirect>
              } />
              <Route path="/applicant-dashboard" element={
                <ProtectedRoute requiredUserType="applicant">
                  <ApplicantDashboard />
                </ProtectedRoute>
              } />
              <Route path="/recruiter-dashboard" element={
                <ProtectedRoute requiredUserType="recruiter">
                  <RecruiterDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;