/**
 * Persistencia de tokens en el cliente.
 *
 * Decisión: localStorage para el access token (sobrevive a F5) y refresh
 * token. Si fuera un BFF con cookies httpOnly esto cambiaría — para el
 * Sprint 1 esta solución es suficiente y permite tests e2e sin servidor.
 *
 * Encapsulado en un módulo para que ningún consumidor toque `localStorage`
 * directamente: si mañana migramos a cookies, solo se cambia aquí.
 */
const ACCESS_KEY = 'kore.auth.access';
const REFRESH_KEY = 'kore.auth.refresh';
const USER_KEY = 'kore.auth.user';

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  getStoredUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set(access: string, refresh: string, user: unknown): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
