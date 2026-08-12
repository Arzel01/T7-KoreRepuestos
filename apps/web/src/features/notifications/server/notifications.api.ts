import { api } from '@/lib/api-client';

import type {
  CreatePushSubscriptionDto,
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

  // ADR-0006 — Web Push.
  subscribePush: (payload: CreatePushSubscriptionDto): Promise<void> =>
    api.post('/notifications/push-subscriptions', payload),

  unsubscribePush: (endpoint: string): Promise<void> =>
    api.delete(`/notifications/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`),
};
