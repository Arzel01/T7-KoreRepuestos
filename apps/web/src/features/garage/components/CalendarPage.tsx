import { Check, Loader2, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/features/cart/hooks/CartContext';
import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';

import { useVehicleCalendar } from '../hooks/useVehicleCalendar';
import { useVehicles } from '../hooks/useVehicles';

import { CalendarItem } from './CalendarItem';
import { CalendarMonthView } from './CalendarMonthView';
import { MaintenanceHistory } from './MaintenanceHistory';

export function CalendarPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const id = Number(vehicleId);

  const { vehicles, loading: loadingVehicles } = useVehicles();
  const { calendar, loading: loadingCalendar, markComplete } = useVehicleCalendar(id);
  const { addMany } = useCart();
  const [addingNext, setAddingNext] = useState(false);
  const [addedNext, setAddedNext] = useState(false);

  const vehicle = vehicles.find((v) => v.id === id);
  const vehicleName = vehicle
    ? `${vehicle.model.marca.nombre} ${vehicle.model.nombre} ${vehicle.year}`
    : '...';

  const nextService = calendar[0];
  const loading = loadingVehicles || loadingCalendar;

  async function handleMarkComplete(planId: number, mileage: number, notes?: string) {
    await markComplete({ planId, completedMileage: mileage, notes });
  }

  async function handleAddNextParts() {
    if (!nextService || nextService.products.length === 0 || addingNext) return;
    setAddingNext(true);
    try {
      await addMany(nextService.products.map((p) => ({ productId: p.id, quantity: p.quantity })));
      setAddedNext(true);
      window.setTimeout(() => setAddedNext(false), 2500);
    } catch {
      // El error del carrito se refleja en la página del carrito.
    } finally {
      setAddingNext(false);
    }
  }

  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link
            to="/garage"
            className="text-sm text-navy-600 hover:underline flex items-center gap-1 w-fit"
          >
            ← Volver a Mi Garaje
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Calendario de Mantenimiento</h1>
          {vehicle && (
            <p className="mt-1 text-muted-foreground">
              {vehicleName}
              {vehicle.alias && ` · ${vehicle.alias}`}
              {` · ${vehicle.currentMileage.toLocaleString()} km`}
            </p>
          )}
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && nextService && vehicle && (
          <Card className="mb-8 rounded-2xl border-primary/30 bg-primary/5 shadow-sm">
            <CardContent className="px-6 py-5">
              <p className="text-xs font-semibold text-primary mb-2">Próximo Mantenimiento</p>
              <h2 className="text-xl font-bold text-foreground">{nextService.description}</h2>
              <div className="mt-2 flex flex-col gap-1 text-sm text-foreground sm:flex-row sm:gap-6">
                <span>Kilometraje: {nextService.mileageInterval.toLocaleString()} km</span>
                <span>
                  Faltan:{' '}
                  <strong className="text-primary">
                    {nextService.kmRemaining.toLocaleString()} km
                  </strong>
                </span>
              </div>
              <Button
                className="mt-4 w-full gap-1.5 sm:w-auto"
                variant="outline"
                disabled={nextService.products.length === 0 || addingNext}
                onClick={() => void handleAddNextParts()}
              >
                {addingNext ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : addedNext ? (
                  <Check className="size-4" />
                ) : (
                  <ShoppingCart className="size-4" />
                )}
                {addedNext ? 'Agregado al carrito' : 'Agregar Repuestos al Carrito'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && calendar.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border px-8 py-16 text-center">
            <p className="text-muted-foreground">
              No hay tareas de mantenimiento configuradas para este vehículo.
            </p>
          </div>
        )}

        {!loading && calendar.length > 0 && vehicle && (
          <Tabs defaultValue="timeline">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-foreground">Próximos Mantenimientos</h2>
              <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
                <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
                <TabsTrigger value="calendar">Calendario</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timeline">
              <div className="space-y-4">
                {calendar.map((item) => (
                  <CalendarItem
                    key={item.planId}
                    item={item}
                    vehicleId={id}
                    currentMileage={vehicle.currentMileage}
                    onMarkComplete={handleMarkComplete}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarMonthView items={calendar} />
            </TabsContent>

            <TabsContent value="history">
              <MaintenanceHistory vehicleId={id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
