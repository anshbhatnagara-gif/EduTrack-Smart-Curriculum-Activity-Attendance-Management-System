import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, getMeApi, logoutApi, changePasswordApi } from '../api/auth.api';
import { getToken, setToken, removeToken } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);

  // Restore Session on mount
  const restoreSession = useCallback(async () => {
    const storedToken = getToken();
    if (!storedToken) {
      setUser(null);
      setTokenState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await getMeApi();
      if (res.success && res.data) {
        setUser(res.data);
        setTokenState(storedToken);
      } else {
        removeToken();
        setUser(null);
        setTokenState(null);
      }
    } catch (err) {
      console.warn('Session restoration failed:', err.message);
      removeToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Event listener for unauthorized (401) global events from axiosClient
    const handleUnauthorized = () => {
      removeToken();
      setUser(null);
      setTokenState(null);
    };

    window.addEventListener('edutrack:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('edutrack:unauthorized', handleUnauthorized);
    };
  }, [restoreSession]);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    if (res.success && res.data?.token) {
      const accessToken = res.data.token;
      setToken(accessToken);
      setTokenState(accessToken);
      setUser(res.data.user);
      return res.data.user;
    } else {
      throw new Error(res.message || 'Login failed.');
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn('Backend logout call failed or token expired:', err.message);
    } finally {
      removeToken();
      setUser(null);
      setTokenState(null);
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    const res = await changePasswordApi(oldPassword, newPassword);
    return res;
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    restoreSession,
    changePassword,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
