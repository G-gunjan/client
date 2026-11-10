
// Manages global authentication state, including login, registration, session restoration, and logout.

import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then((d) => setUser(d.user)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const finish = (d) => { setToken(d.token); setUser(d.user); };
  const value = {
    user, loading, setUser,
    login: async (email, password) => finish(await api.post('/auth/login', { email, password })),
    register: async (name, email, password) => finish(await api.post('/auth/register', { name, email, password })),
    logout: () => { setToken(null); setUser(null); }
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
