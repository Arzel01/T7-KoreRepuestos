import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

const TOP_FILTERS: Array<{
  id: string;
  label: string;
  field: keyof VehicleFilters;
  options: readonly string[];
}> = [
  { id: 'vehicle-brand', label: 'Marca', field: 'brand', options: VEHICLE_BRANDS },
  { id: 'vehicle-model', label: 'Modelo', field: 'model', options: VEHICLE_MODELS },
  { id: 'vehicle-type', label: 'Tipo', field: 'type', options: VEHICLE_TYPES },
];

/**
 * Selector de vehículo controlado.
 *
 * Rango de años:
 *   · "Desde" siempre visible.
 *   · "Hasta" aparece al lado cuando "Desde" tiene valor, mostrando solo
 *     años ≥ yearFrom para imposibilitar rangos inválidos.
 *   · Badge resumen aparece cuando ambos están seleccionados.
 *   · Botón × limpia solo el campo de año (yearFrom + yearTo).
 */
export function VehicleSelector({ vehicle, onVehicleChange }: VehicleSelectorProps): JSX.Element {
  const hasYearRange = vehicle.year && vehicle.yearTo;
  const yearToOptions = vehicle.year
    ? VEHICLE_YEARS.filter((y) => parseInt(y, 10) >= parseInt(vehicle.year, 10))
    : VEHICLE_YEARS;

  const clearYear = (): void => {
    onVehicleChange('year', '');
  };

  return (
    <div className="space-y-3">
      {/* Marca, Modelo, Tipo */}
      {TOP_FILTERS.map((g) => (
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

      {/* Rango de año */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Año</Label>

          {/* Badge resumen + botón limpiar — solo cuando hay rango completo */}
          {hasYearRange && (
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px] font-medium">
                {vehicle.year}
                <span className="text-muted-foreground">–</span>
                {vehicle.yearTo}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
                onClick={clearYear}
                title="Limpiar rango de año"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Año desde */}
          <Select
            value={vehicle.year || undefined}
            onValueChange={(val) => onVehicleChange('year', val)}
          >
            <SelectTrigger id="vehicle-year" className="bg-background">
              <SelectValue placeholder="Desde" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Separador — visible solo cuando "Desde" tiene valor */}
          {vehicle.year && <span className="shrink-0 text-xs text-muted-foreground">–</span>}

          {/* Año hasta — aparece solo cuando "Desde" tiene valor */}
          {vehicle.year && (
            <Select
              value={vehicle.yearTo || undefined}
              onValueChange={(val) => onVehicleChange('yearTo', val)}
            >
              <SelectTrigger id="vehicle-year-to" className="bg-background">
                <SelectValue placeholder="Hasta" />
              </SelectTrigger>
              <SelectContent>
                {yearToOptions.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
