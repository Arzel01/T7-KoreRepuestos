import { UserRole, type UserResponse } from '@kore/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { onUnauthorized } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';

import { authApi, type LoginPayload, type RegisterPayload } from '../server/auth.api';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<UserResponse>;
  register: (payload: RegisterPayload) => Promise<UserResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<UserResponse | null>(() =>
    tokenStorage.getStoredUser<UserResponse>(),
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onUnauthorized(() => setUser(null));
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<UserResponse> => {
    setIsLoading(true);
    try {
      const { user: u, tokens } = await authApi.login(payload);
      tokenStorage.set(tokens.accessToken, tokens.refreshToken, u);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<UserResponse> => {
    setIsLoading(true);
    try {
      const { user: u, tokens } = await authApi.register(payload);
      tokenStorage.set(tokens.accessToken, tokens.refreshToken, u);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const refresh = tokenStorage.getRefreshToken();
    if (refresh) {
      await authApi.logout(refresh).catch(() => undefined);
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === UserRole.ADMINISTRADOR,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
