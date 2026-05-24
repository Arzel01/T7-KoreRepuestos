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

import { authApi, type LoginPayload, type RegisterPayload } from './api/auth.api';

/**
 * Contexto global de autenticación.
 *
 * Mantiene en memoria el `UserResponse` y expone métodos imperativos
 * (`login`, `register`, `logout`). La fuente de verdad del token es
 * `tokenStorage` — el contexto solo refleja el estado.
 *
 * Se conecta al cliente HTTP a través de `onUnauthorized` para hacer
 * logout automático si un 401 llega al interceptor (token expirado).
 */
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

  // Si la API responde 401 (token expirado/revocado), limpiamos el estado.
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
      // No fallamos el logout local si la API no responde.
      await authApi.logout(refresh).catch(() => undefined);
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === UserRole.ADMIN,
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
