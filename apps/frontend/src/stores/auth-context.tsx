import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, Permission } from '@app/shared';
import { authApi } from '@/services/api/auth';
import { setUnauthorizedHandler } from '@/services/api/client';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  hasPermission: (permission?: Permission) => boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const result = await authApi.me();
      setUser(result.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    void (async () => {
      await authApi.csrf().catch(() => undefined);
      await refreshUser();
      setLoading(false);
    })();
    return () => setUnauthorizedHandler(null);
  }, [refreshUser]);

  const login = useCallback(async (loginValue: string, password: string) => {
    const result = await authApi.login(loginValue, password);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission?: Permission) => {
      if (!permission) return true;
      return Boolean(user?.permissions.includes(permission));
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, hasPermission, login, logout, refreshUser }),
    [user, loading, hasPermission, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}
