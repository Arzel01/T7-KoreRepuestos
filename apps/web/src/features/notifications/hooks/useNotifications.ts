import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/AuthContext';
import { extractApiErrorMessage } from '@/lib/api-client';

import { notificationsApi } from '../server/notifications.api';

import type { NotificationResponse } from '@kore/shared';

interface UseNotifications {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markRead: (id: number) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Centro de notificaciones in-app del usuario (US#2). Sigue el patrón manual
 * de estado del proyecto (useState/useCallback, sin react-query). Solo carga
 * cuando hay sesión; para invitados devuelve una lista vacía.
 */
export function useNotifications(): UseNotifications {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
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
  }, [isAuthenticated, load]);

  const markRead = useCallback(async (id: number) => {
    const updated = await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return { notifications, unreadCount, loading, error, markRead, reload: load };
}
