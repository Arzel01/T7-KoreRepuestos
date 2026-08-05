import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/AuthContext';
import { extractApiErrorMessage } from '@/lib/api-client';

import { garageApi } from '../server/garage.api';

import type { VehiclePlanResponse } from '@kore/shared';

export interface MaintenanceOverview {
  plans: VehiclePlanResponse[];
  /** Σ de `estimatedTotalCost` de todos los vehículos. */
  totalCost: number;
  /** Servicios vencidos sumados en todos los vehículos. */
  overdueCount: number;
  /** Servicios críticos sumados en todos los vehículos. */
  criticalCount: number;
  /** Próximo servicio (fecha más cercana) entre todos los vehículos. */
  nextServiceDate?: string;
}

interface UseMaintenanceOverview {
  overview: MaintenanceOverview | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Agrega el plan de mantenimiento de todos los vehículos del usuario (US#3)
 * para el dashboard: obtiene los vehículos y su `/plan` en paralelo y resume
 * costos y contadores. Solo carga con sesión.
 */
export function useMaintenanceOverview(): UseMaintenanceOverview {
  const { isAuthenticated } = useAuth();
  const [overview, setOverview] = useState<MaintenanceOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const vehicles = await garageApi.getVehicles();
      const plans = await Promise.all(vehicles.map((v) => garageApi.getPlan(v.id)));

      const totalCost = plans.reduce((sum, p) => sum + p.estimatedTotalCost, 0);
      const overdueCount = plans.reduce((sum, p) => sum + p.overdueCount, 0);
      const criticalCount = plans.reduce((sum, p) => sum + p.criticalCount, 0);
      const nextServiceDate = plans
        .map((p) => p.nextServiceDate)
        .filter((d): d is string => Boolean(d))
        .sort((a, b) => a.localeCompare(b))[0];

      setOverview({ plans, totalCost, overdueCount, criticalCount, nextServiceDate });
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setOverview(null);
      return;
    }
    void load();
  }, [isAuthenticated, load]);

  return { overview, loading, error, reload: load };
}
