import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      if (token !== storedToken) {
        setToken(storedToken);
      }
      try {
        const userData = await authService.verifyToken(storedToken);
        setUser(userData);
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('admin_token');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (key) => {
    // Set loading to true right before the async operation
    setLoading(true);
    try {
      const { token: newToken, user: userData } = await authService.login(key);
      localStorage.setItem('admin_token', newToken);
      setUser(userData);
      setToken(newToken); // This state update will trigger re-renders in consumers
      return { token: newToken, user: userData };
    } catch (error) {
      localStorage.removeItem('admin_token');
      setUser(null);
      setToken(null);
      throw error;
    } finally {
      // Set loading to false after the async operation completes, regardless of success or failure
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};