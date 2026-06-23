import { useCallback, useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { garageApi } from '../server/garage.api';

import type { CalendarItemDto, CreateMaintenanceLogDto } from '@kore/shared';

export function useVehicleCalendar(vehicleId: number) {
  const [calendar, setCalendar] = useState<CalendarItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await garageApi.getCalendar(vehicleId);
      setCalendar(data);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const markComplete = useCallback(
    async (payload: CreateMaintenanceLogDto): Promise<void> => {
      await garageApi.createLog(vehicleId, payload);
      await load();
    },
    [vehicleId, load],
  );

  return { calendar, loading, error, markComplete, reload: load };
}
