// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { garageApi } from '../server/garage.api';

import { useModels } from './useModels';

import type { ModeloResponse } from '@kore/shared';

vi.mock('../server/garage.api', () => ({
  garageApi: { getModels: vi.fn() },
}));

const mockApi = vi.mocked(garageApi);

const model = (id: number, nombre: string): ModeloResponse =>
  ({ id, nombre }) as unknown as ModeloResponse;

describe('useModels (cascada Marca→Modelo)', () => {
  beforeEach(() => {
    mockApi.getModels.mockResolvedValue([model(10, 'Corolla')]);
  });

  afterEach(() => vi.clearAllMocks());

  it('no consulta modelos cuando no hay marca', () => {
    const { result } = renderHook(() => useModels(null));
    expect(result.current.models).toEqual([]);
    expect(mockApi.getModels).not.toHaveBeenCalled();
  });

  it('carga los modelos de la marca seleccionada', async () => {
    const { result } = renderHook(() => useModels(5));

    await waitFor(() => expect(result.current.models).toHaveLength(1));
    expect(mockApi.getModels).toHaveBeenCalledWith(5);
  });

  it('recarga al cambiar de marca', async () => {
    const { rerender } = renderHook(({ brand }: { brand: number | null }) => useModels(brand), {
      initialProps: { brand: 5 },
    });
    await waitFor(() => expect(mockApi.getModels).toHaveBeenCalledWith(5));

    rerender({ brand: 7 });
    await waitFor(() => expect(mockApi.getModels).toHaveBeenCalledWith(7));
    expect(mockApi.getModels).toHaveBeenCalledTimes(2);
  });
});
