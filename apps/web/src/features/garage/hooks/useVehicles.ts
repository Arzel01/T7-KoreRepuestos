import { useCallback, useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { garageApi } from '../server/garage.api';

import type { CreateVehicleDto, VehicleResponse } from '@kore/shared';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await garageApi.getVehicles();
      setVehicles(data);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addVehicle = useCallback(async (payload: CreateVehicleDto): Promise<VehicleResponse> => {
    const created = await garageApi.createVehicle(payload);
    setVehicles((prev) => [created, ...prev]);
    return created;
  }, []);

  const removeVehicle = useCallback(async (id: number): Promise<void> => {
    await garageApi.deleteVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const refreshMileage = useCallback(async (id: number, currentMileage: number): Promise<void> => {
    await garageApi.updateMileage(id, { currentMileage });
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, currentMileage } : v)));
  }, []);

  return { vehicles, loading, error, addVehicle, removeVehicle, refreshMileage };
}
