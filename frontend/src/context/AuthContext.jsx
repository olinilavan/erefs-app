import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('erefs_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('erefs_token', token);
    localStorage.setItem('erefs_user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await axios.post('/api/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('erefs_token', token);
    localStorage.setItem('erefs_user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('erefs_token');
    localStorage.removeItem('erefs_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Restore token on load
  const token = localStorage.getItem('erefs_token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
