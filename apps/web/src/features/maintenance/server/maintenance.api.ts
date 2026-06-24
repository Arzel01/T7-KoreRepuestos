import { api } from '@/lib/api-client';

import type {
  CreateMaintenanceGuideDto,
  CreateMaintenanceTaskDto,
  MaintenanceTaskResponse,
  MaintenanceGuideResponse,
} from '@kore/shared';

export const maintenanceApi = {
  listTasks: (brandId?: number, modelId?: number): Promise<MaintenanceTaskResponse[]> =>
    api.get('/maintenance/tasks', {
      ...(brandId !== undefined ? { brandId } : {}),
      ...(modelId !== undefined ? { modelId } : {}),
    }),

  listGuides: (brandId?: number, modelId?: number): Promise<MaintenanceGuideResponse[]> =>
    api.get('/maintenance/guides', {
      ...(brandId !== undefined ? { brandId } : {}),
      ...(modelId !== undefined ? { modelId } : {}),
    }),

  createGuide: (payload: CreateMaintenanceGuideDto): Promise<MaintenanceGuideResponse> =>
    api.post('/maintenance/guides', payload),

  createTask: (
    guideId: number,
    payload: CreateMaintenanceTaskDto,
  ): Promise<MaintenanceTaskResponse> => api.post(`/maintenance/guides/${guideId}/tasks`, payload),
};
