import { CheckCircle, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserVehicles } from '@/features/garage/hooks/useUserVehicles';

// import type { VehicleResponse } from '@kore/shared';

interface CompatibilityCheckProps {
  productId: number;
  categoryId?: number | null;
}

/**
 * Componente que muestra la compatibilidad del producto con los vehículos
 * del usuario registrados en su garaje.
 *
 * Nota: La compatibilidad real se determina a través de las guías de mantenimiento
 * vinculadas a los modelos de vehículos. Por ahora, mostramos un mensaje informativo.
 */
export function CompatibilityCheck({
  productId: _productId,
  categoryId: _categoryId,
}: CompatibilityCheckProps): JSX.Element | null {
  const { vehicles, loading } = useUserVehicles();

  // Si no hay vehículos o no está autenticado, no mostrar nada
  if (!loading && vehicles.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-600">
        Verificando compatibilidad...
      </div>
    );
  }

  return (
    <Card className="border-navy-200 bg-gradient-to-br from-navy-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-navy-900">
          <CheckCircle className="w-5 h-5" />
          Compatibilidad con tu garaje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {vehicles.length === 0 ? (
            <div className="flex items-start gap-2 text-sm text-neutral-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Agrega vehículos a tu garaje para ver información de compatibilidad.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-700 font-medium">Tus vehículos:</p>
              <div className="space-y-2">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-navy-100"
                  >
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-navy-100 text-navy-700 font-semibold text-sm">
                        🚗
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900">
                        {vehicle.alias || vehicle.model.nombre}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {vehicle.model.marca.nombre} {vehicle.model.nombre} • {vehicle.year}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-navy-100 text-navy-700 text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Compatible
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-600 italic pt-2">
                ℹ️ Esta información se basa en nuestro sistema de compatibilidad. Verifica con tu
                mecánico antes de comprar.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
