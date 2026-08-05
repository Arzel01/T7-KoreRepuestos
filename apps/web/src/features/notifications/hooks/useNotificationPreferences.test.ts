// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/features/auth/hooks/AuthContext';

import { notificationsApi } from '../server/notifications.api';

import { useNotificationPreferences } from './useNotificationPreferences';

import type { NotificationPreferencesResponse } from '@kore/shared';

vi.mock('@/features/auth/hooks/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../server/notifications.api', () => ({
  notificationsApi: {
    list: vi.fn(),
    markRead: vi.fn(),
    unreadCount: vi.fn(),
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

const mockAuth = vi.mocked(useAuth);
const mockApi = vi.mocked(notificationsApi);

const prefs = (
  over: Partial<NotificationPreferencesResponse> = {},
): NotificationPreferencesResponse => ({
  remindersEnabled: true,
  emailChannel: true,
  appChannel: true,
  daysBefore: 7,
  ...over,
});

function setAuth(isAuthenticated: boolean): void {
  mockAuth.mockReturnValue({ isAuthenticated } as ReturnType<typeof useAuth>);
}

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    mockApi.getPreferences.mockResolvedValue(prefs());
  });
  afterEach(() => vi.clearAllMocks());

  it('no carga preferencias sin sesión', async () => {
    setAuth(false);
    const { result } = renderHook(() => useNotificationPreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi.getPreferences).not.toHaveBeenCalled();
    expect(result.current.preferences).toBeNull();
  });

  it('carga las preferencias con sesión', async () => {
    setAuth(true);
    const { result } = renderHook(() => useNotificationPreferences());
    await waitFor(() => expect(result.current.preferences).not.toBeNull());
    expect(result.current.preferences?.daysBefore).toBe(7);
  });

  it('update persiste y refleja el nuevo estado', async () => {
    setAuth(true);
    mockApi.updatePreferences.mockResolvedValue(prefs({ emailChannel: false }));
    const { result } = renderHook(() => useNotificationPreferences());
    await waitFor(() => expect(result.current.preferences).not.toBeNull());

    await act(async () => {
      await result.current.update({ emailChannel: false });
    });

    expect(mockApi.updatePreferences).toHaveBeenCalledWith({ emailChannel: false });
    expect(result.current.preferences?.emailChannel).toBe(false);
  });
});
