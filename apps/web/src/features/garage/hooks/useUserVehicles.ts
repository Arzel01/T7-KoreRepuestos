import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/AuthContext';
import { garageApi } from '@/features/garage/server/garage.api';

import type { VehicleResponse } from '@kore/shared';

/**
 * Hook para obtener los vehículos del usuario autenticado.
 * Usado en la página de detalles de producto para mostrar compatibilidad.
 */
export function useUserVehicles(): {
  vehicles: VehicleResponse[];
  loading: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const fetchVehicles = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await garageApi.getVehicles();
        setVehicles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching vehicles');
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchVehicles();
  }, [user]);

  return { vehicles, loading, error };
}
