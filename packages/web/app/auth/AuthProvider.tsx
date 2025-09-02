'use client';
import React from 'react';
import { absUrl } from '../lib/api';

export type AuthUser = { id: string; email: string };

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType | null>(null);

const LS_KEY = 'wg_token';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<AuthUser | null>(null);

  const loadFromStorage = React.useCallback(() => {
    try {
      const t = window.localStorage.getItem(LS_KEY);
      if (t) setToken(t);
    } catch {}
  }, []);

  const saveToStorage = React.useCallback((t: string | null) => {
    try {
      if (t) window.localStorage.setItem(LS_KEY, t);
      else window.localStorage.removeItem(LS_KEY);
    } catch {}
  }, []);

  const refresh = React.useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const r = await fetch(absUrl('/me'), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await r.json();
      const u = (data && data.user) || null;
      setUser(u);
    } catch {
      setUser(null);
    }
  }, [token]);

  React.useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  React.useEffect(() => {
    if (token) refresh();
  }, [token, refresh]);

  // Keep cookie in sync with token for server actions
  React.useEffect(() => {
    try {
      if (token) {
        document.cookie = `wg_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
      } else {
        document.cookie = `wg_token=; path=/; max-age=0; samesite=lax`;
      }
    } catch {}
  }, [token]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      try {
        const r = await fetch(absUrl('/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await r.json();
        if (!r.ok || !data?.token) return false;
        setToken(data.token);
        saveToStorage(data.token);
        try {
          document.cookie = `wg_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
        } catch {}
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [refresh, saveToStorage],
  );

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    saveToStorage(null);
    try {
      document.cookie = `wg_token=; path=/; max-age=0; samesite=lax`;
    } catch {}
  }, [saveToStorage]);

  const value: AuthContextType = { user, token, login, logout, refresh };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext is not available');
  return ctx;
}
