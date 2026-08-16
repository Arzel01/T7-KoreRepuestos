import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/features/auth/hooks/AuthContext';
import { extractApiErrorMessage } from '@/lib/api-client';

import { notificationsApi } from '../server/notifications.api';

import type { NotificationResponse } from '@kore/shared';

interface NotificationsState {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markRead: (id: number) => Promise<void>;
  reload: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsState | null>(null);

/**
 * Centro de notificaciones in-app del usuario (US#2), como contexto global
 * (mismo patrón que `CartContext`) para que cualquier acción que sabemos que
 * encola un recordatorio en el backend — actualizar kilometraje, por ahora —
 * pueda llamar `reload()` y reflejarlo al instante en la campana, sin esperar
 * al poll de respaldo.
 */
export function NotificationsProvider({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await notificationsApi.list());
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    void load();
    // Respaldo para lo que se encola sin una acción directa del usuario (p.
    // ej. el barrido diario a las 7am): las mutaciones que sí sabemos que
    // encolan algo (ver useVehicles.refreshMileage) llaman reload() directo.
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, load]);

  const markRead = useCallback(async (id: number) => {
    const updated = await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const value = useMemo<NotificationsState>(
    () => ({ notifications, unreadCount, loading, error, markRead, reload: load }),
    [notifications, unreadCount, loading, error, markRead, load],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsState {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications() debe usarse dentro de <NotificationsProvider>');
  }
  return ctx;
}
