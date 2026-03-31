import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(null); // 🔥 FIX
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await apiService.getProfile();

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }

    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, userType) => {
    const response = await apiService.login(email, password, userType);

    if (response.success) {
      setUser(response.user);
      localStorage.setItem('userType', userType);
      localStorage.setItem('userEmail', email);
    }

    return response;
  };

  const register = async (userData) => {
    return await apiService.register(userData);
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } finally {
      setUser(null);
      localStorage.clear();
      window.location.href = "/"; // 🔥 FIX
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};