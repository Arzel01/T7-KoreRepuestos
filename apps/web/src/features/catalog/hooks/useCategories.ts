import { useEffect, useState } from 'react';

import { categoriesApi } from '@/features/products/server/products.api';

import type { CategoryResponse } from '@kore/shared';

/**
 * Carga las categorías raíz una sola vez (se consumen en el sidebar de
 * filtros). Sin estado de error visible: si falla, el grupo de categorías
 * simplemente no se muestra — el resto del catálogo sigue funcionando.
 */
export function useCategories(): { categories: CategoryResponse[]; loading: boolean } {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    categoriesApi
      .list()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}
