import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserVehicles } from '@/features/garage/hooks/useUserVehicles';
import { productsApi } from '@/features/products/server/products.api';

import type { CompatibilityItem } from '@kore/shared';

interface CompatibilityCheckProps {
  productId: number;
  categoryId?: number | null;
}

export function CompatibilityCheck({ productId }: CompatibilityCheckProps): JSX.Element | null {
  const { vehicles, loading: vehiclesLoading } = useUserVehicles();
  const [compatibility, setCompatibility] = useState<CompatibilityItem[]>([]);
  const [loadingCompat, setLoadingCompat] = useState(true);

  useEffect(() => {
    productsApi
      .getCompatibility(productId)
      .then(setCompatibility)
      .catch(() => setCompatibility([]))
      .finally(() => setLoadingCompat(false));
  }, [productId]);

  if (!vehiclesLoading && vehicles.length === 0) return null;

  if (vehiclesLoading || loadingCompat) {
    return (
      <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-600">
        Verificando compatibilidad...
      </div>
    );
  }

  if (vehicles.length === 0) return null;

  const compatibleModelIds = new Set(compatibility.map((c) => c.modelId));

  return (
    <Card className="border-navy-200 bg-gradient-to-br from-navy-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-navy-900">
          <CheckCircle className="w-5 h-5" />
          Compatibilidad con tu garaje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {vehicles.map((vehicle) => {
            const isCompatible = compatibleModelIds.has(vehicle.model.id);
            return (
              <div
                key={vehicle.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-navy-100"
              >
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900">
                    {vehicle.alias || vehicle.model.nombre}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {vehicle.model.marca.nombre} {vehicle.model.nombre} • {vehicle.year}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {compatibility.length === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs">
                      <AlertCircle className="w-3 h-3" /> Sin datos
                    </span>
                  ) : isCompatible ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" /> Compatible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      <XCircle className="w-3 h-3" /> No compatible
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-neutral-500 italic pt-3">
          Verifica con tu mecánico antes de comprar.
        </p>
      </CardContent>
    </Card>
  );
}
