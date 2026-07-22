import { api } from '@/lib/api-client';

import type { SearchAnalyticsResponse } from '@kore/shared';

export const analyticsApi = {
  getSearchAnalytics: (days = 30, limit = 20): Promise<SearchAnalyticsResponse> =>
    api.get('/analytics/searches', { days, limit }),
};
