import { useCallback, useEffect, useState } from 'react';

import { productsApi } from '@/features/products/server/products.api';
import { extractApiErrorMessage } from '@/lib/api-client';

import type { PaginatedResult, ProductQueryParams, ProductResponse } from '@kore/shared';

interface CatalogProductsState {
  data: PaginatedResult<ProductResponse> | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Carga la página actual del catálogo cada vez que cambian los filtros
 * aplicados. `appliedKey` (la query string) es la dependencia: barata de
 * comparar y cambia exactamente cuando cambia algún filtro.
 *
 * Patrón flag-de-cancelación (StrictMode-safe), igual que el admin.
 */
export function useCatalogProducts(
  applied: ProductQueryParams,
  appliedKey: string,
): CatalogProductsState {
  const [data, setData] = useState<PaginatedResult<ProductResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    productsApi
      .list(applied)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- appliedKey serializa `applied`
  }, [appliedKey, attempt]);

  return { data, loading, error, retry };
}
