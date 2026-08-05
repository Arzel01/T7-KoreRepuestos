import { api } from '@/lib/api-client';

import type {
  NotificationPreferencesResponse,
  NotificationResponse,
  UpdateNotificationPreferencesDto,
} from '@kore/shared';

export const notificationsApi = {
  list: (): Promise<NotificationResponse[]> => api.get('/notifications'),

  unreadCount: (): Promise<{ count: number }> => api.get('/notifications/unread-count'),

  markRead: (id: number): Promise<NotificationResponse> => api.patch(`/notifications/${id}/read`),

  getPreferences: (): Promise<NotificationPreferencesResponse> =>
    api.get('/notifications/preferences'),

  updatePreferences: (
    payload: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponse> => api.patch('/notifications/preferences', payload),
};
