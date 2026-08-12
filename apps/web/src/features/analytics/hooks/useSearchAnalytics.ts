import { useCallback, useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { analyticsApi } from '../server/analytics.api';

import type { SearchAnalyticsResponse } from '@kore/shared';

interface SearchAnalyticsState {
  data: SearchAnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useSearchAnalytics(days: number, limit = 20): SearchAnalyticsState {
  const [data, setData] = useState<SearchAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    analyticsApi
      .getSearchAnalytics(days, limit)
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
  }, [days, limit, attempt]);

  return { data, loading, error, retry };
}
