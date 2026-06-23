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

import type { VehicleFilters } from '../hooks/useCatalogFilters';

interface VehicleSelectorProps {
  vehicle: VehicleFilters;
  onVehicleChange: (field: keyof VehicleFilters, value: string) => void;
}

/**
 * Selector de vehículo controlado — cada cambio escribe su valor en la URL
 * (vía `onVehicleChange`) y el catálogo se refresca automáticamente.
 *
 * "Modelo" se resetea al cambiar "Marca" para evitar combinaciones inválidas
 * (ej. Kia + Corolla). La lógica de reset vive en `useCatalogFilters.setVehicle`.
 *
 * Nota: las opciones son estáticas por ahora (datos de muestra de
 * `vehicle-placeholder.ts`). Cuando el backend tenga compatibilidad vehicular
 * real, bastará con reemplazar las listas por props o un hook de fetch.
 */
export function VehicleSelector({ vehicle, onVehicleChange }: VehicleSelectorProps): JSX.Element {
  const groups: Array<{
    id: string;
    label: string;
    field: keyof VehicleFilters;
    options: readonly string[];
  }> = [
    { id: 'vehicle-brand', label: 'Marca', field: 'brand', options: VEHICLE_BRANDS },
    { id: 'vehicle-model', label: 'Modelo', field: 'model', options: VEHICLE_MODELS },
    { id: 'vehicle-type', label: 'Tipo', field: 'type', options: VEHICLE_TYPES },
    { id: 'vehicle-year', label: 'Año', field: 'year', options: VEHICLE_YEARS },
  ];

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.id} className="space-y-1.5">
          <Label htmlFor={g.id} className="text-xs text-muted-foreground">
            {g.label}
          </Label>
          <Select
            value={vehicle[g.field] || undefined}
            onValueChange={(val) => onVehicleChange(g.field, val)}
          >
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
    </div>
  );
}
