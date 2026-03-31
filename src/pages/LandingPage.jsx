import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4 animate-pulse">
            JobMatch AI
          </h1>
          <p className="text-gray-300 text-lg animate-fadeIn animation-delay-300">
            Find your perfect match with AI-powered job matching
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-300 text-center">Job Seekers</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/applicant-login')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/applicant-signup')}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Sign Up
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-300 text-center">Recruiters</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/recruiter-login')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-600 transform hover:scale-105"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/recruiter-signup')}
                className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-500 transform hover:scale-105"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;