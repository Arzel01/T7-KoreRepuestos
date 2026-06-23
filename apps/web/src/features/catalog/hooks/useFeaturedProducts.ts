import { useEffect, useState } from 'react';

import { productsApi } from '@/features/products/server/products.api';
import { extractApiErrorMessage } from '@/lib/api-client';

import type { ProductResponse } from '@kore/shared';

interface FeaturedProductsState {
  products: ProductResponse[];
  loading: boolean;
  error: string | null;
}

export function useFeaturedProducts(): FeaturedProductsState {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    productsApi
      .list({ sortBy: 'createdAt', sortOrder: 'desc', pageSize: 8, inStock: true })
      .then((res) => {
        if (!cancelled) setProducts(res.items);
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
  }, []);

  return { products, loading, error };
}
