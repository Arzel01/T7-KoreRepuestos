import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { garageApi } from '@/features/garage/server/garage.api';

import { VEHICLE_TYPES, VEHICLE_YEARS } from '../data/vehicle-placeholder';

import type { VehicleFilters } from '../hooks/useCatalogFilters';
import type { MarcaResponse, ModeloResponse } from '@kore/shared';

interface VehicleSelectorProps {
  vehicle: VehicleFilters;
  onVehicleChange: (field: keyof VehicleFilters, value: string) => void;
}

/**
 * Selector de vehículo controlado.
 *
 * Marca y Modelo se cargan desde la API real (garageApi).
 * El modelo se filtra en cascada según la marca seleccionada.
 * Los filtros almacenan el nombre (string) para compatibilidad
 * con la búsqueda textual del backend.
 *
 * Rango de años:
 *   · "Desde" siempre visible.
 *   · "Hasta" aparece al lado cuando "Desde" tiene valor.
 *   · Badge resumen cuando ambos están seleccionados.
 *   · Botón × limpia year + yearTo.
 */
export function VehicleSelector({ vehicle, onVehicleChange }: VehicleSelectorProps): JSX.Element {
  const [brands, setBrands] = useState<MarcaResponse[]>([]);
  const [models, setModels] = useState<ModeloResponse[]>([]);

  // Load brands once
  useEffect(() => {
    garageApi
      .getBrands()
      .then(setBrands)
      .catch(() => null);
  }, []);

  // When the selected brand name changes, find its ID and load models
  useEffect(() => {
    if (!vehicle.brand) {
      setModels([]);
      return;
    }
    const found = brands.find((b) => b.nombre === vehicle.brand);
    if (!found) return;
    garageApi
      .getModels(found.id)
      .then(setModels)
      .catch(() => null);
  }, [vehicle.brand, brands]);

  const hasYearRange = vehicle.year && vehicle.yearTo;
  const yearToOptions = vehicle.year
    ? VEHICLE_YEARS.filter((y) => parseInt(y, 10) >= parseInt(vehicle.year, 10))
    : VEHICLE_YEARS;

  function handleBrandChange(brandName: string) {
    const actualBrand = brandName === '__all__' ? '' : brandName;
    // setVehicle('brand', ...) ya limpia el modelo internamente — llamar
    // onVehicleChange('model', '') aquí también pisaría el cambio de marca,
    // porque ambas llamadas comparten el mismo searchParams (sin re-render
    // entre medio) y la última en ejecutarse gana.
    onVehicleChange('brand', actualBrand);
  }

  const clearYear = (): void => {
    onVehicleChange('year', '');
  };

  return (
    <div className="space-y-3">
      {/* Marca */}
      <div className="space-y-1.5">
        <Label htmlFor="vehicle-brand" className="text-xs text-muted-foreground">
          Marca
        </Label>
        <Select value={vehicle.brand ? vehicle.brand : '__all__'} onValueChange={handleBrandChange}>
          <SelectTrigger id="vehicle-brand" className="w-full bg-background">
            <SelectValue placeholder="Seleccione marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.nombre}>
                {b.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Modelo — cascading */}
      <div className="space-y-1.5">
        <Label htmlFor="vehicle-model" className="text-xs text-muted-foreground">
          Modelo
        </Label>
        <Select
          value={vehicle.model ? vehicle.model : '__all__'}
          onValueChange={(val) => onVehicleChange('model', val === '__all__' ? '' : val)}
          disabled={!vehicle.brand}
        >
          <SelectTrigger id="vehicle-model" className="w-full bg-background">
            <SelectValue
              placeholder={vehicle.brand ? 'Seleccione modelo' : 'Seleccione marca primero'}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.nombre}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tipo (estático — sin tabla en BD) */}
      <div className="space-y-1.5">
        <Label htmlFor="vehicle-type" className="text-xs text-muted-foreground">
          Tipo
        </Label>
        <Select
          value={vehicle.type ? vehicle.type : '__all__'}
          onValueChange={(val) => onVehicleChange('type', val === '__all__' ? '' : val)}
        >
          <SelectTrigger id="vehicle-type" className="w-full bg-background">
            <SelectValue placeholder="Seleccione tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {VEHICLE_TYPES.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rango de año */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Año</Label>

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
          <Select
            value={vehicle.year ? vehicle.year : '__all__'}
            onValueChange={(val) => onVehicleChange('year', val === '__all__' ? '' : val)}
          >
            <SelectTrigger id="vehicle-year" className="bg-background">
              <SelectValue placeholder="Desde" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {VEHICLE_YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {vehicle.year && <span className="shrink-0 text-xs text-muted-foreground">–</span>}

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
