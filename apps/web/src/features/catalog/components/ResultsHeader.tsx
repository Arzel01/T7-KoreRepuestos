import { Car } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ResultsHeaderProps {
  total: number | null;
  loading: boolean;
}

/** Encabezado del área de resultados: conteo + botón "Garaje" (placeholder). */
export function ResultsHeader({ total, loading }: ResultsHeaderProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold" aria-live="polite">
        {loading || total === null ? 'Buscando…' : `${total} Productos encontrados`}
      </h2>
      {/* TODO(catalog): "Garaje" — guardar vehículos del usuario (futuro) */}
      <Button variant="default" className="gap-2" title="Garaje (próximamente)">
        <Car className="size-4" aria-hidden="true" />
        Garaje
      </Button>
    </div>
  );
}
