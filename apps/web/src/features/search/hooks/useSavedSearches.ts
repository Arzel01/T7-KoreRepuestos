import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/AuthContext';
import { extractApiErrorMessage } from '@/lib/api-client';

import { savedSearchesApi } from '../server/saved-searches.api';

import type { SavedSearchParams, SavedSearchResponse } from '@kore/shared';

interface UseSavedSearches {
  savedSearches: SavedSearchResponse[];
  loading: boolean;
  error: string | null;
  save: (nombre: string, parametros: SavedSearchParams) => Promise<SavedSearchResponse>;
  remove: (id: number) => Promise<void>;
}

/**
 * CRUD de búsquedas guardadas del usuario. Sigue el patrón manual de estado
 * del proyecto (useState/useCallback, sin react-query) — ver `useVehicles`.
 * Solo carga cuando hay sesión; para invitados devuelve una lista vacía.
 */
export function useSavedSearches(): UseSavedSearches {
  const { isAuthenticated } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearchResponse[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedSearches([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    savedSearchesApi
      .list()
      .then((data) => !cancelled && setSavedSearches(data))
      .catch((err) => !cancelled && setError(extractApiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const save = useCallback(async (nombre: string, parametros: SavedSearchParams) => {
    const created = await savedSearchesApi.create({ nombre: nombre.trim(), parametros });
    setSavedSearches((prev) => [created, ...prev]);
    return created;
  }, []);

  const remove = useCallback(async (id: number) => {
    await savedSearchesApi.remove(id);
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { savedSearches, loading, error, save, remove };
}
