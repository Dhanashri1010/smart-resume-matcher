import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-2xl border-b border-gray-700">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
          JobMatch AI
        </Link>
        
        {isAuthenticated && user && (
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
              <span className="text-sm font-medium text-gray-300">Welcome, {user.profile?.firstName || user.email.split('@')[0]}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;