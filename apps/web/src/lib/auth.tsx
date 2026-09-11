'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { TokenResponseDto } from '@velure/contracts';
import { ApiClientError, apiFetch } from '@/lib/api-client';

type AuthUser = TokenResponseDto['user'];

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    countryCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((session: TokenResponseDto) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const res = await apiFetch<TokenResponseDto>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    applySession(res.data!);
    return res.data!;
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<TokenResponseDto>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      applySession(res.data!);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      countryCode?: string;
    }) => {
      const res = await apiFetch<TokenResponseDto>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          acceptTerms: true,
          countryCode: input.countryCode ?? 'IL',
        }),
      });
      applySession(res.data!);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshSession = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const authFetch = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      const run = (token: string | null) =>
        apiFetch<T>(path, {
          ...options,
          accessToken: token ?? undefined,
        });

      try {
        const res = await run(accessToken);
        return res.data as T;
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          const session = await refresh();
          const res = await run(session.accessToken);
          return res.data as T;
        }
        throw err;
      }
    },
    [accessToken, refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      logout,
      refreshSession,
      authFetch,
    }),
    [user, accessToken, isLoading, login, register, logout, refreshSession, authFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
