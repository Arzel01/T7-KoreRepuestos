// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/features/auth/hooks/AuthContext';

import { notificationsApi } from '../server/notifications.api';

import { NotificationsProvider, useNotifications } from './NotificationsContext';

import type { NotificationResponse } from '@kore/shared';
import type { ReactNode } from 'react';

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

const notif = (id: number, read = false): NotificationResponse => ({
  id,
  tipo: 'recordatorio_mantenimiento',
  titulo: `N${id}`,
  mensaje: 'm',
  canal: 'app',
  estado: read ? 'leida' : 'pendiente',
  createdAt: '2026-08-04T00:00:00.000Z',
  readAt: read ? '2026-08-04T01:00:00.000Z' : undefined,
});

function setAuth(isAuthenticated: boolean): void {
  mockAuth.mockReturnValue({ isAuthenticated } as ReturnType<typeof useAuth>);
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(NotificationsProvider, null, children);
}

describe('useNotifications (NotificationsContext)', () => {
  beforeEach(() => {
    mockApi.list.mockResolvedValue([notif(1), notif(2, true)]);
  });
  afterEach(() => vi.clearAllMocks());

  it('no consulta la API sin sesión', async () => {
    setAuth(false);
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi.list).not.toHaveBeenCalled();
    expect(result.current.notifications).toEqual([]);
  });

  it('carga notificaciones y calcula no leídas', async () => {
    setAuth(true);
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));
    expect(result.current.unreadCount).toBe(1); // solo la #1 sin leer
  });

  it('markRead actualiza la notificación y baja el conteo', async () => {
    setAuth(true);
    mockApi.markRead.mockResolvedValue(notif(1, true));
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(mockApi.markRead).toHaveBeenCalledWith(1);
    expect(result.current.unreadCount).toBe(0);
  });

  it('reload() vuelve a pedir la lista (encolar algo fuera de una carga automática)', async () => {
    setAuth(true);
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    mockApi.list.mockResolvedValueOnce([notif(1), notif(2, true), notif(3)]);
    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.notifications).toHaveLength(3);
  });

  it('lanza si se usa fuera de <NotificationsProvider>', () => {
    // Silencia el console.error que React emite al renderizar un hook que
    // lanza en render — no queremos ruido esperado en la salida del test.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useNotifications())).toThrow(
      'useNotifications() debe usarse dentro de <NotificationsProvider>',
    );
    spy.mockRestore();
  });
});
