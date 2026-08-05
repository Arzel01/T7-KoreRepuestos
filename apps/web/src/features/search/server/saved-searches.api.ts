import { api } from '@/lib/api-client';

import type { CreateSavedSearchDto, SavedSearchResponse } from '@kore/shared';

export const savedSearchesApi = {
  list: (): Promise<SavedSearchResponse[]> => api.get('/searches'),

  create: (payload: CreateSavedSearchDto): Promise<SavedSearchResponse> =>
    api.post('/searches', payload),

  remove: (id: number): Promise<void> => api.delete(`/searches/${id}`),
};
