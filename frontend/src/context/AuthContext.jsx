import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const INACTIVITY_TIMEOUT_MS = 25 * 60 * 1000;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getMe()
      .then((me) => {
        if (active && me?.user) setSession(me);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (credentialsOrRole) => {
    const payload =
      typeof credentialsOrRole === 'string'
        ? {
            email:
              credentialsOrRole === 'rrhh'
                ? 'ana.solis@ticosoft.cr'
                : 'diego.chaves@ticosoft.cr',
            password: 'DemoRRHH2026!',
          }
        : credentialsOrRole;

    const nextSession = await api.login(payload);
    setSession(nextSession);
    return nextSession;
  }, []);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await api.logout();
    } catch {
      // Limpiamos el estado local aunque la cookie ya hubiera expirado
    } finally {
      setSession(null);
      window.setTimeout(() => setIsSigningOut(false), 320);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) return undefined;

    let timerId = window.setTimeout(() => {
      signOut();
    }, INACTIVITY_TIMEOUT_MS);

    const resetTimer = () => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => {
        signOut();
      }, INACTIVITY_TIMEOUT_MS);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [session?.user, signOut]);

  const value = useMemo(
    () => ({
      ...session,
      isAuthenticated: Boolean(session?.user),
      signIn,
      signOut,
      isLoading,
      isSigningOut,
    }),
    [session, signIn, signOut, isLoading, isSigningOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
