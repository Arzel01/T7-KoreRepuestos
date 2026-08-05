import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/AuthContext';
import { extractApiErrorMessage } from '@/lib/api-client';

import { notificationsApi } from '../server/notifications.api';

import type {
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesDto,
} from '@kore/shared';

interface UseNotificationPreferences {
  preferences: NotificationPreferencesResponse | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  update: (patch: UpdateNotificationPreferencesDto) => Promise<void>;
}

/**
 * Preferencias de notificación del usuario (US#2). Carga al montar (si hay
 * sesión) y persiste cambios optimistamente vía `update`.
 */
export function useNotificationPreferences(): UseNotificationPreferences {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferencesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setPreferences(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    notificationsApi
      .getPreferences()
      .then((data) => !cancelled && setPreferences(data))
      .catch((err) => !cancelled && setError(extractApiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const update = useCallback(async (patch: UpdateNotificationPreferencesDto) => {
    setSaving(true);
    setError(null);
    try {
      const next = await notificationsApi.updatePreferences(patch);
      setPreferences(next);
    } catch (err) {
      setError(extractApiErrorMessage(err));
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { preferences, loading, saving, error, update };
}
