import { useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { maintenanceApi } from '../server/maintenance.api';

import type { MaintenanceGuideResponse } from '@kore/shared';

export function useMaintenanceGuides(brandId?: number, modelId?: number) {
  const [tasks, setTasks] = useState<MaintenanceGuideResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    maintenanceApi
      .listGuides(brandId, modelId)
      .then(setTasks)
      .catch((err) => setError(extractApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [brandId, modelId]);

  return { tasks, loading, error };
}
