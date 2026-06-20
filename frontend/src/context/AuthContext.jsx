import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('erefs_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('erefs_token', token);
    localStorage.setItem('erefs_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/api/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('erefs_token', token);
    localStorage.setItem('erefs_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const googleLogin = async (credential, extra = {}) => {
    const res = await api.post('/api/auth/google', { credential, ...extra });
    if (res.data.needsRole) return res.data;
    const { token, user } = res.data;
    localStorage.setItem('erefs_token', token);
    localStorage.setItem('erefs_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('erefs_token');
    localStorage.removeItem('erefs_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
