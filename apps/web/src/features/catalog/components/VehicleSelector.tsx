import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  VEHICLE_BRANDS,
  VEHICLE_MODELS,
  VEHICLE_TYPES,
  VEHICLE_YEARS,
} from '../data/vehicle-placeholder';

/**
 * Selector de vehículo — PLACEHOLDER visual.
 * El backend no tiene datos de compatibilidad vehicular todavía: los
 * dropdowns muestran opciones estáticas y no afectan los resultados.
 */
export function VehicleSelector(): JSX.Element {
  const groups: Array<{ id: string; label: string; options: readonly string[] }> = [
    {
      id: 'vehicle-brand',
      label: 'Marca',
      options: [...VEHICLE_BRANDS].sort((a, b) => a.localeCompare(b)),
    },
    {
      id: 'vehicle-model',
      label: 'Modelo',
      options: [...VEHICLE_MODELS].sort((a, b) => a.localeCompare(b)),
    },
    {
      id: 'vehicle-type',
      label: 'Tipo',
      options: [...VEHICLE_TYPES].sort((a, b) => a.localeCompare(b)),
    },
    {
      id: 'vehicle-year',
      label: 'Año',
      options: [...VEHICLE_YEARS].sort((a, b) => b.localeCompare(a)),
    },
  ];

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.id} className="space-y-1.5">
          <Label htmlFor={g.id} className="text-xs text-muted-foreground">
            {g.label}
          </Label>
          <Select>
            <SelectTrigger id={g.id} className="w-full bg-background">
              <SelectValue placeholder={`Seleccione ${g.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {g.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <p className="text-[11px] italic text-muted-foreground">
        Búsqueda por vehículo disponible próximamente.
      </p>
    </div>
  );
}
