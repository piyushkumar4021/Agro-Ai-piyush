import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('agro_token');
      const saved = localStorage.getItem('agro_user');
      if (token && saved) {
        try {
          setUser(JSON.parse(saved));
          const res = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setUser(data.user);
              localStorage.setItem('agro_user', JSON.stringify(data.user));
            } else {
              localStorage.removeItem('agro_token');
              localStorage.removeItem('agro_user');
              setUser(null);
            }
          }
          // if backend unreachable, keep the locally-stored user (graceful offline)
        } catch {
          // backend unreachable — stay logged in with localStorage data
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Invalid credentials');
    localStorage.setItem('agro_token', data.token);
    localStorage.setItem('agro_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('agro_token', data.token);
    localStorage.setItem('agro_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('agro_token');
    localStorage.removeItem('agro_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('agro_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading,
      isLoggedIn: !!user,
      isFarmer:   user?.role === 'farmer',
      isBuyer:    user?.role === 'buyer',
      isAdmin:    user?.role === 'admin',
      login, logout, register, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
