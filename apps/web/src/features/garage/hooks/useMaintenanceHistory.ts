import { useCallback, useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { garageApi } from '../server/garage.api';

import type { MaintenanceRecordResponse } from '@kore/shared';

/** US#4 — historial de mantenimiento de un vehículo (`GET /maintenance/records`). */
export function useMaintenanceHistory(vehicleId: number) {
  const [records, setRecords] = useState<MaintenanceRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await garageApi.getRecords(vehicleId));
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { records, loading, error, reload: load };
}
