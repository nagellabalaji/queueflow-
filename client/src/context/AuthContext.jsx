import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [manager, setManager] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('queueflow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getCurrentUser();
        setManager(data.manager);
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  const handleAuthSuccess = (newToken, managerData) => {
    localStorage.setItem('queueflow_token', newToken);
    setToken(newToken);
    setManager(managerData);
  };

  const login = async (username, password) => {
    const data = await api.login(username, password);
    handleAuthSuccess(data.token, data.manager);
    return data;
  };

  const register = async (username, password, name) => {
    const data = await api.register(username, password, name);
    handleAuthSuccess(data.token, data.manager);
    return data;
  };

  const demoLogin = async () => {
    const data = await api.demoLogin();
    handleAuthSuccess(data.token, data.manager);
    return data;
  };

  const loginWithGoogle = async (payload) => {
    const data = await api.loginWithGoogle(payload);
    handleAuthSuccess(data.token, data.manager);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('queueflow_token');
    setToken(null);
    setManager(null);
  };

  return (
    <AuthContext.Provider value={{ manager, token, loading, login, register, demoLogin, loginWithGoogle, logout, isAuthenticated: !!manager }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
