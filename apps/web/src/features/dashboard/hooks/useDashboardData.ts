import { useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { dashboardApi } from '../server/dashboard.api';

import type { DashboardSummaryResponse, SalesTrendPoint, TopProductStat } from '@kore/shared';

interface DashboardDataState {
  summary: DashboardSummaryResponse | null;
  salesTrend: SalesTrendPoint[];
  topProducts: TopProductStat[];
  loading: boolean;
  error: string | null;
}

/** Datos en vivo del panel administrativo (KPIs + gráficos), para Admin/Asesor. */
export function useDashboardData(): DashboardDataState {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getSalesTrend(30),
      dashboardApi.getTopProducts(5),
    ])
      .then(([summaryRes, trendRes, topRes]) => {
        if (cancelled) return;
        setSummary(summaryRes);
        setSalesTrend(trendRes);
        setTopProducts(topRes);
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

  return { summary, salesTrend, topProducts, loading, error };
}
