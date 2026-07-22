"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { api, ApiError, setAccessToken } from "../api";

type User = {
  id: string;
  email: string;
  emailVerified: boolean | null;
  role: { name: string } | null;
  profile: { name: string | null; avatarUrl: string | null } | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Module-level vars for deduplicating refresh calls across component tree
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;
let refreshSubscribers: Array<() => void> = [];

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const interceptorReady = useRef(false);

  // Fetch user profile
  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<User>("/users/me");
      setUser(data);
      return data;
    } catch {
      setUser(null);
      setAccessToken(null);
      return null;
    }
  }, []);

  // Refresh session — silent on first call (no redirect on missing session)
  const refreshToken = useCallback(
    async (silent = false) => {
      if (isRefreshing) {
        return new Promise<void>((resolve) => {
          refreshSubscribers.push(resolve);
        });
      }

      isRefreshing = true;
      refreshPromise = new Promise<void>(async (resolve) => {
        try {
          const { accessToken } = await api.post<{ accessToken: string }>(
            "/auth/refresh"
          );
          setAccessToken(accessToken);
          onRefreshed();
          resolve();
        } catch {
          setUser(null);
          setAccessToken(null);
          if (!silent) {
            router.push("/session-expired");
          }
          onRefreshed();
          resolve(); // resolve rather than reject — handled via user state
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      });

      return refreshPromise;
    },
    [router]
  );

  // Set up 401 interceptor once
  useEffect(() => {
    if (interceptorReady.current) return;
    interceptorReady.current = true;

    const originalGet = api.get;
    const originalPost = api.post;

    const withInterceptor = <T extends (...args: any[]) => Promise<any>>(
      fn: T
    ) => {
      return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
          return await fn(...args);
        } catch (error: unknown) {
          if (error instanceof ApiError && error.status === 401) {
            await refreshToken();
            return await fn(...args);
          }
          throw error;
        }
      };
    };

    api.get = withInterceptor(originalGet) as typeof api.get;
    api.post = withInterceptor(originalPost) as typeof api.post;
  }, [refreshToken]);

  // Initial load
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      await refreshToken(true); // silent — no redirect
      await fetchUser();
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  }, [fetchUser, refreshToken]);

  useEffect(() => {
    refreshUser();
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const { accessToken } = await api.post<{ accessToken: string }>(
        "/auth/login",
        { email, password, rememberMe }
      );
      setAccessToken(accessToken);
      await fetchUser();
    },
    [fetchUser]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      await api.post("/auth/register", { email, password, name });
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refreshUser }),
    [user, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
