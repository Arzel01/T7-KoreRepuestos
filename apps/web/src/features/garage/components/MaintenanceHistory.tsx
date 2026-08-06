import { CheckCircle2, Wrench } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useMaintenanceHistory } from '../hooks/useMaintenanceHistory';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** US#4 — Muestra el historial de mantenimientos completados de un vehículo. */
export function MaintenanceHistory({ vehicleId }: { vehicleId: number }): JSX.Element {
  const { records, loading, error } = useMaintenanceHistory(vehicleId);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border px-8 py-16 text-center">
        <Wrench className="mx-auto mb-3 size-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-muted-foreground">
          Aún no hay mantenimientos registrados para este vehículo.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {records.map((record) => (
        <li key={record.id}>
          <Card className="rounded-2xl border-green-200 bg-green-50/60 shadow-sm">
            <CardContent className="flex items-start gap-3 px-5 py-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">
                    {record.planDescription ?? 'Servicio de mantenimiento'}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(record.completedAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kilometraje: {record.completedMileage.toLocaleString()} km
                </p>
                {record.notes && (
                  <p className="mt-1 text-sm text-foreground">
                    <span className="font-medium">Notas:</span> {record.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
