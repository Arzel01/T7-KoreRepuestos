// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { garageApi } from '../server/garage.api';

import { useVehicles } from './useVehicles';

import type { VehicleResponse } from '@kore/shared';

vi.mock('../server/garage.api', () => ({
  garageApi: {
    getVehicles: vi.fn(),
    createVehicle: vi.fn(),
    deleteVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    updateMileage: vi.fn(),
  },
}));

const mockApi = vi.mocked(garageApi);

const vehicle = (id: number, alias: string): VehicleResponse =>
  ({ id, alias, year: 2020, currentMileage: 1000 }) as unknown as VehicleResponse;

describe('useVehicles', () => {
  beforeEach(() => {
    mockApi.getVehicles.mockResolvedValue([vehicle(1, 'Corolla')]);
  });

  afterEach(() => vi.clearAllMocks());

  it('carga los vehículos del usuario al montar', async () => {
    const { result } = renderHook(() => useVehicles());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.vehicles).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('addVehicle antepone el vehículo creado', async () => {
    mockApi.createVehicle.mockResolvedValue(vehicle(2, 'Hilux'));
    const { result } = renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addVehicle({
        brandId: 1,
        modelId: 1,
        year: 2022,
        currentMileage: 0,
      });
    });

    expect(result.current.vehicles.map((v) => v.id)).toEqual([2, 1]);
  });

  it('removeVehicle elimina de la lista', async () => {
    mockApi.deleteVehicle.mockResolvedValue(undefined);
    const { result } = renderHook(() => useVehicles());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeVehicle(1);
    });

    expect(result.current.vehicles).toHaveLength(0);
  });

  it('expone el mensaje de error si la carga falla', async () => {
    mockApi.getVehicles.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useVehicles());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });
});
