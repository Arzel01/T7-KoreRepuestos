// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/features/auth/hooks/AuthContext';

import { garageApi } from '../server/garage.api';

import { useMaintenanceOverview } from './useMaintenanceOverview';

import type { VehiclePlanResponse, VehicleResponse } from '@kore/shared';

vi.mock('@/features/auth/hooks/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../server/garage.api', () => ({
  garageApi: { getVehicles: vi.fn(), getPlan: vi.fn() },
}));

const mockAuth = vi.mocked(useAuth);
const mockApi = vi.mocked(garageApi);

const model = { id: 1, nombre: 'Corolla', marca: { id: 1, nombre: 'Toyota' } };

const vehicle = (id: number): VehicleResponse =>
  ({
    id,
    year: 2020,
    currentMileage: 10000,
    averageDailyMileage: 20,
    createdAt: '2026-01-01T00:00:00.000Z',
    model,
  }) as VehicleResponse;

const plan = (over: Partial<VehiclePlanResponse>): VehiclePlanResponse => ({
  vehicleId: 1,
  year: 2020,
  currentMileage: 10000,
  averageDailyMileage: 20,
  model,
  services: [],
  estimatedTotalCost: 0,
  criticalCount: 0,
  overdueCount: 0,
  ...over,
});

function setAuth(isAuthenticated: boolean): void {
  mockAuth.mockReturnValue({ isAuthenticated } as ReturnType<typeof useAuth>);
}

describe('useMaintenanceOverview', () => {
  afterEach(() => vi.clearAllMocks());
  beforeEach(() => {
    mockApi.getVehicles.mockResolvedValue([vehicle(1), vehicle(2)]);
    mockApi.getPlan.mockImplementation((id: number) =>
      Promise.resolve(
        id === 1
          ? plan({
              vehicleId: 1,
              estimatedTotalCost: 240,
              overdueCount: 1,
              criticalCount: 2,
              nextServiceDate: '2026-09-01',
            })
          : plan({
              vehicleId: 2,
              estimatedTotalCost: 60,
              overdueCount: 0,
              criticalCount: 1,
              nextServiceDate: '2026-06-15',
            }),
      ),
    );
  });

  it('no carga sin sesión', async () => {
    setAuth(false);
    const { result } = renderHook(() => useMaintenanceOverview());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApi.getVehicles).not.toHaveBeenCalled();
    expect(result.current.overview).toBeNull();
  });

  it('agrega costos, contadores y la fecha más cercana entre vehículos', async () => {
    setAuth(true);
    const { result } = renderHook(() => useMaintenanceOverview());
    await waitFor(() => expect(result.current.overview).not.toBeNull());

    const o = result.current.overview!;
    expect(o.plans).toHaveLength(2);
    expect(o.totalCost).toBe(300); // 240 + 60
    expect(o.overdueCount).toBe(1);
    expect(o.criticalCount).toBe(3); // 2 + 1
    expect(o.nextServiceDate).toBe('2026-06-15'); // la más cercana
  });
});
