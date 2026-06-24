import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { extractApiErrorMessage } from '@/lib/api-client';

import { garageApi } from '../server/garage.api';

import type { MaintenanceGuideResponse } from '@kore/shared';

export function MaintenanceGuidesListPage(): JSX.Element {
  const [guides, setGuides] = useState<MaintenanceGuideResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    garageApi
      .getGuides()
      .then(setGuides)
      .catch((err) => setError(extractApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-8 py-12 animate-fade-in-up">
      <header className="mb-10 flex items-end justify-between border-b border-border pb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Sprint 3 · US-Maintenance
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            Guías de mantenimiento<span className="text-primary">.</span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Planes preventivos oficiales por modelo de vehículo.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/maintenance/new">+ Nueva guía</Link>
        </Button>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Cargando guías…</p>}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && guides.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No hay guías creadas todavía.</p>
          <Button asChild className="mt-4">
            <Link to="/admin/maintenance/new">Crear la primera guía</Link>
          </Button>
        </div>
      )}

      {!loading && guides.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">ID</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Marca</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Modelo</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Tareas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {guides.map((g) => (
                <tr key={g.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-4 font-mono text-xs text-primary">{g.id}</td>
                  <td className="px-6 py-4 font-medium">{g.modelo?.marca?.nombre ?? '—'}</td>
                  <td className="px-6 py-4">{g.modelo?.nombre ?? '—'}</td>
                  <td className="max-w-xs truncate px-6 py-4 text-muted-foreground">
                    {g.descripcion ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">{g.plans?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
