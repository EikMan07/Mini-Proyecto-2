import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const STORAGE_KEY = 'kendall-session';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSession(JSON.parse(stored)); }
      catch { localStorage.removeItem(STORAGE_KEY); }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (role) => {
    const nextSession = await api.login({ email: role === 'rrhh' ? 'maria@kendall.cr' : 'kendall@kendall.cr', password: 'demo', role });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    return nextSession;
  };

  const signOut = () => { localStorage.removeItem(STORAGE_KEY); setSession(null); };
  const value = useMemo(() => ({ ...session, isAuthenticated: Boolean(session), signIn, signOut, isLoading }), [session, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
