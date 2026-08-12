import { api } from '@/lib/api-client';

import type { DashboardSummaryResponse, SalesTrendPoint, TopProductStat } from '@kore/shared';

export const dashboardApi = {
  getSummary: (): Promise<DashboardSummaryResponse> => api.get('/dashboard/summary'),

  getSalesTrend: (days = 30): Promise<SalesTrendPoint[]> =>
    api.get('/dashboard/sales-trend', { days }),

  getTopProducts: (limit = 5): Promise<TopProductStat[]> =>
    api.get('/dashboard/top-products', { limit }),
};
