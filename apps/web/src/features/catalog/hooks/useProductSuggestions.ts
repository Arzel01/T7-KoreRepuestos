import { useEffect, useRef, useState } from 'react';

import { productsApi } from '@/features/products/server/products.api';

import type { ProductSuggestion } from '@/features/products/server/products.api';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export function useProductSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < MIN_CHARS) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      productsApi
        .getSuggestions(query, controller.signal)
        .then((data) => setSuggestions(data))
        .catch(() => {
          /* aborted or network error — ignore */
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  return { suggestions, loading };
}
