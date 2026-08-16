// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/features/auth/hooks/AuthContext';

import { savedSearchesApi } from '../server/saved-searches.api';

import { useSavedSearches } from './useSavedSearches';

import type { SavedSearchResponse } from '@kore/shared';

vi.mock('@/features/auth/hooks/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../server/saved-searches.api', () => ({
  savedSearchesApi: { list: vi.fn(), create: vi.fn(), remove: vi.fn() },
}));

const mockAuth = vi.mocked(useAuth);
const mockApi = vi.mocked(savedSearchesApi);

const saved = (id: number, nombre: string): SavedSearchResponse => ({
  id,
  nombre,
  parametros: { search: nombre },
  createdAt: '2026-08-04T00:00:00.000Z',
});

function setAuth(isAuthenticated: boolean): void {
  mockAuth.mockReturnValue({ isAuthenticated } as ReturnType<typeof useAuth>);
}

describe('useSavedSearches', () => {
  beforeEach(() => {
    mockApi.list.mockResolvedValue([saved(1, 'Pastillas')]);
  });

  afterEach(() => vi.clearAllMocks());

  it('no consulta la API si el usuario no está autenticado', async () => {
    setAuth(false);
    const { result } = renderHook(() => useSavedSearches());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi.list).not.toHaveBeenCalled();
    expect(result.current.savedSearches).toEqual([]);
  });

  it('carga las búsquedas guardadas cuando hay sesión', async () => {
    setAuth(true);
    const { result } = renderHook(() => useSavedSearches());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.savedSearches).toHaveLength(1);
  });

  it('save antepone la búsqueda creada', async () => {
    setAuth(true);
    mockApi.create.mockResolvedValue(saved(2, 'Balatas'));
    const { result } = renderHook(() => useSavedSearches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save('Balatas', { search: 'balatas' });
    });

    expect(result.current.savedSearches.map((s) => s.id)).toEqual([2, 1]);
    expect(mockApi.create).toHaveBeenCalledWith({
      nombre: 'Balatas',
      parametros: { search: 'balatas' },
    });
  });

  it('remove elimina la búsqueda de la lista', async () => {
    setAuth(true);
    mockApi.remove.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSavedSearches());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(result.current.savedSearches).toHaveLength(0);
  });
});
