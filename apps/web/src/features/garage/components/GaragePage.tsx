import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';

import { useVehicleCalendar } from '../hooks/useVehicleCalendar';
import { useVehicles } from '../hooks/useVehicles';

import { AddVehicleModal } from './AddVehicleModal';
import { VehicleCard } from './VehicleCard';

import type { UpdateVehiclePayload } from '../server/garage.api';
import type { VehicleResponse } from '@kore/shared';

function VehicleCardWithCalendar({
  vehicle,
  onUpdateMileage,
  onUpdate,
  onDelete,
}: {
  vehicle: VehicleResponse;
  onUpdateMileage: (mileage: number) => Promise<void>;
  onUpdate: (id: number, payload: UpdateVehiclePayload) => Promise<unknown>;
  onDelete: () => void;
}) {
  const { calendar, reload } = useVehicleCalendar(vehicle.id);

  // Subir el kilometraje puede cambiar cuál es el próximo servicio (o
  // vencer uno existente) — sin recargar el calendario, "Próximo
  // Mantenimiento" se queda con los datos del kilometraje anterior.
  async function handleUpdateMileage(mileage: number) {
    await onUpdateMileage(mileage);
    await reload();
  }

  return (
    <VehicleCard
      vehicle={vehicle}
      nextService={calendar[0]}
      onUpdateMileage={handleUpdateMileage}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
}

export function GaragePage() {
  const { vehicles, loading, addVehicle, removeVehicle, refreshMileage, updateVehicle } =
    useVehicles();
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este vehículo?')) return;
    setDeletingId(id);
    try {
      await removeVehicle(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Mi Garaje</h1>
            <p className="mt-1 text-neutral-500">
              Gestiona tus vehículos y mantén el control del mantenimiento
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/garage/dashboard">Panel de mantenimiento</Link>
            </Button>
            <Button onClick={() => setShowAdd(true)}>+ Agregar Vehículo</Button>
          </div>
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && vehicles.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 px-8 py-16 text-center">
            <p className="text-neutral-500">No tienes vehículos registrados.</p>
            <Button className="mt-4" onClick={() => setShowAdd(true)}>
              + Agregar tu primer vehículo
            </Button>
          </div>
        )}

        {!loading && vehicles.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {vehicles.map((v) => (
              <VehicleCardWithCalendar
                key={v.id}
                vehicle={v}
                onUpdateMileage={(km) => refreshMileage(v.id, km)}
                onUpdate={updateVehicle}
                onDelete={() => {
                  if (deletingId === null) void handleDelete(v.id);
                }}
              />
            ))}
          </div>
        )}

        <AddVehicleModal open={showAdd} onClose={() => setShowAdd(false)} onSave={addVehicle} />
      </div>
    </div>
  );
}
