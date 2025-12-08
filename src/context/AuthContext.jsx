import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, adminAuthService } from '../services/apiService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userType = localStorage.getItem('user_type'); // 'user' or 'admin'
      
      if (token && userType === 'admin') {
        const adminData = await adminAuthService.getAdminProfile();
        setAdmin(adminData);
      } else if (token && userType === 'user') {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_type');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_type', 'user');
    setUser(data.user);
    return data;
  };

  const adminLogin = async (email, password) => {
    const data = await adminAuthService.login(email, password);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_type', 'admin');
    setAdmin(data.admin);
    return data;
  };

  const signup = async (userData) => {
    const data = await authService.signup(userData);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_type', 'user');
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_type');
    setUser(null);
    setAdmin(null);
  };

  const value = {
    user,
    admin,
    loading,
    login,
    adminLogin,
    signup,
    logout,
    isAuthenticated: !!user || !!admin,
    isAdmin: !!admin,
    isUser: !!user,
    adminRole: admin?.role, // 'admin1' or 'admin2'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
