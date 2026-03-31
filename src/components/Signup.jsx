import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = ({ userType }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        userType,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          ...(userType === 'recruiter' && { company: formData.company })
        }
      };

      const response = await register(userData);
      
      if (response.success) {
        setSuccess(true);
        // Show success message for 2 seconds then redirect to login
        setTimeout(() => {
          navigate(`/${userType}-login`);
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 animate-slideUp">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-cyan-400 animate-slideInDown">
            {userType === 'applicant' ? 'Applicant Signup' : 'Recruiter Signup'}
          </h2>
          <p className="text-gray-400 animate-fadeIn animation-delay-300">
            Create your account to get started
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm animate-slideInDown">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-300 text-sm animate-slideInDown">
            ✅ Account created successfully! Redirecting to login...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 animate-slideInUp animation-delay-500">
          {success && (
            <div className="text-center py-4">
              <div className="text-green-400 text-lg font-semibold mb-2">
                🎉 Welcome to JobMatch AI!
              </div>
              <div className="text-gray-300 text-sm">
                Please wait while we redirect you to login...
              </div>
            </div>
          )}
          
          <div className={success ? 'opacity-50 pointer-events-none' : ''}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-white placeholder-gray-400"
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-white placeholder-gray-400"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          {userType === 'recruiter' && (
            <div>
              <label className="block text-gray-300 font-medium mb-2">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-white placeholder-gray-400"
                placeholder="Company name"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-gray-300 font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-white placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-white placeholder-gray-400"
              placeholder="Enter your password"
              minLength="6"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 text-white placeholder-gray-400"
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 animate-bounceIn animation-delay-900"
          >
            {loading ? 'Creating Account...' : success ? 'Account Created!' : 'Sign Up'}
          </button>
          </div>
        </form>
        
        <div className="mt-6 text-center space-y-2 animate-fadeIn animation-delay-1000">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate(`/${userType}-login`)}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-all duration-200 hover:scale-110"
            >
              Login here
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

export default Signup;