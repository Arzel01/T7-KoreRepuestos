import { AlertTriangle, CalendarClock, DollarSign, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';
import { NotificationPreferences } from '@/features/notifications/components/NotificationPreferences';

import { useMaintenanceOverview } from '../hooks/useMaintenanceOverview';

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Dashboard de mantenimiento (US#3): KPIs agregados de todos los vehículos del
 * usuario (próximo servicio, costo estimado, vencidos, críticos), la lista de
 * vehículos con su plan, y las preferencias de notificación.
 */
export function MaintenanceDashboard(): JSX.Element {
  const { overview, loading, error } = useMaintenanceOverview();

  const kpis = [
    {
      label: 'Próximo servicio',
      value: formatDate(overview?.nextServiceDate),
      icon: CalendarClock,
    },
    {
      label: 'Costo estimado',
      value: overview ? money(overview.totalCost) : '—',
      icon: DollarSign,
    },
    {
      label: 'Servicios vencidos',
      value: overview ? String(overview.overdueCount) : '—',
      icon: AlertTriangle,
    },
    {
      label: 'Servicios críticos',
      value: overview ? String(overview.criticalCount) : '—',
      icon: Wrench,
    },
  ];

  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Mantenimiento</h1>
            <p className="mt-1 text-muted-foreground">
              Resumen de tus vehículos y próximos servicios.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/garage">Mi Garaje</Link>
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* KPIs */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-2xl">
              <CardContent className="flex items-center gap-4 p-6">
                <span className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  {loading ? (
                    <Skeleton className="mt-1 h-7 w-20" />
                  ) : (
                    <p className="text-2xl font-semibold">{value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Lista de vehículos con su plan */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Tus vehículos</h2>

          {loading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          )}

          {!loading && overview && overview.plans.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed px-8 py-12 text-center text-muted-foreground">
              Aún no tienes vehículos.{' '}
              <Link to="/garage" className="text-primary hover:underline">
                Agrega uno en Mi Garaje
              </Link>
              .
            </div>
          )}

          <div className="space-y-4">
            {!loading &&
              overview?.plans.map((plan) => (
                <Card key={plan.vehicleId} className="rounded-2xl">
                  <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base">
                      {plan.model.marca.nombre} {plan.model.nombre} {plan.year}
                      {plan.alias && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          · {plan.alias}
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      {plan.overdueCount > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground">
                          {plan.overdueCount} vencido{plan.overdueCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/garage/${plan.vehicleId}/calendar`}>Ver plan</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-x-8 gap-y-1 pb-5 text-sm text-muted-foreground">
                    <span>
                      Kilometraje: <strong>{plan.currentMileage.toLocaleString()} km</strong>
                    </span>
                    <span>
                      Próximo servicio: <strong>{formatDate(plan.nextServiceDate)}</strong>
                    </span>
                    <span>
                      Costo estimado: <strong>{money(plan.estimatedTotalCost)}</strong>
                    </span>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>

        {/* Preferencias de notificación (US#2) */}
        <section className="max-w-xl">
          <NotificationPreferences />
        </section>
      </div>
    </div>
  );
}
