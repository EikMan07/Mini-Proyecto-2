import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';

const STORAGE_KEY = 'kendall-session';
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  const signIn = async (role) => {
    const nextSession = await api.login({ email: role === 'rrhh' ? 'maria@kendall.cr' : 'kendall@kendall.cr', password: 'demo', role });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    return nextSession;
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };
  const value = useMemo(() => ({ ...session, isAuthenticated: Boolean(session), signIn, signOut }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
