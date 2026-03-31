import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = ({ userType }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData.email, formData.password, userType);
      
      if (response.success) {
        if (userType === 'applicant') {
          navigate('/applicant-dashboard');
        } else {
          navigate('/recruiter-dashboard');
        }
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 animate-slideUp">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-cyan-400 animate-slideInDown">
            {userType === 'applicant' ? 'Applicant Login' : 'Recruiter Login'}
          </h2>
          <p className="text-gray-400 animate-fadeIn animation-delay-300">
            {userType === 'applicant' ? 'Ready to find your dream job?' : 'Ready to find top talent?'}
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm animate-slideInDown">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 animate-slideInUp animation-delay-500">
          <div className="animate-slideInLeft animation-delay-600">
            <label className="block text-gray-300 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-white placeholder-gray-400 transform focus:scale-105"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="animate-slideInRight animation-delay-700">
            <label className="block text-gray-300 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-white placeholder-gray-400 transform focus:scale-105"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 animate-bounceIn animation-delay-900"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-2 animate-fadeIn animation-delay-1000">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate(`/${userType}-signup`)}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-all duration-200 hover:scale-110"
            >
              Sign up here
            </button>
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-300 text-sm font-medium transition-all duration-200 hover:scale-110"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;