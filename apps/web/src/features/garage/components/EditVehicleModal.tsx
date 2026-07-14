import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { extractApiErrorMessage } from '@/lib/api-client';

import { useBrands } from '../hooks/useBrands';
import { useModels } from '../hooks/useModels';

import type { UpdateVehiclePayload } from '../server/garage.api';
import type { VehicleResponse } from '@kore/shared';

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

interface Props {
  open: boolean;
  vehicle: VehicleResponse;
  onClose: () => void;
  onSave: (id: number, payload: UpdateVehiclePayload) => Promise<unknown>;
}

export function EditVehicleModal({ open, vehicle, onClose, onSave }: Props) {
  const { brands } = useBrands();

  const initialBrandId = vehicle.model?.marca?.id ?? null;
  const [brandId, setBrandId] = useState<number | null>(initialBrandId);
  const { models } = useModels(brandId);

  const [modelId, setModelId] = useState<number | null>(vehicle.model?.id ?? null);
  const [year, setYear] = useState<number | null>(vehicle.year);
  const [currentMileage, setCurrentMileage] = useState(String(vehicle.currentMileage));
  const [alias, setAlias] = useState(vehicle.alias ?? '');
  const [plate, setPlate] = useState(vehicle.plate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setBrandId(initialBrandId);
    setModelId(vehicle.model?.id ?? null);
    setYear(vehicle.year);
    setCurrentMileage(String(vehicle.currentMileage));
    setAlias(vehicle.alias ?? '');
    setPlate(vehicle.plate ?? '');
    setError(null);
  }

  async function handleSave() {
    const km = Number(currentMileage);
    if (currentMileage && (isNaN(km) || km < 0)) {
      setError('El kilometraje debe ser un número válido.');
      return;
    }
    if (km < vehicle.currentMileage) {
      setError('El kilometraje no puede ser menor al actual.');
      return;
    }

    const payload: UpdateVehiclePayload = {};
    if (brandId !== initialBrandId && brandId !== null) payload.brandId = brandId;
    if (modelId !== vehicle.model?.id && modelId !== null) payload.modelId = modelId;
    if (year !== null && year !== vehicle.year) payload.year = year;
    if (currentMileage && km !== vehicle.currentMileage) payload.currentMileage = km;
    if (alias.trim() !== (vehicle.alias ?? '')) payload.alias = alias.trim();
    if (plate.trim() !== (vehicle.plate ?? '')) payload.plate = plate.trim() || undefined;

    setSaving(true);
    setError(null);
    try {
      await onSave(vehicle.id, payload);
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Vehículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Select
              value={brandId?.toString() ?? ''}
              onValueChange={(v) => {
                setBrandId(Number(v));
                setModelId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar marca" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Select
              value={modelId?.toString() ?? ''}
              onValueChange={(v) => setModelId(Number(v))}
              disabled={!brandId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar modelo" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Año</Label>
            <Select value={year?.toString() ?? ''} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Kilometraje Actual</Label>
            <Input
              type="number"
              min={vehicle.currentMileage}
              value={currentMileage}
              onChange={(e) => setCurrentMileage(e.target.value)}
              placeholder="Ej. 45000"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Placa (Opcional)</Label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="Ej. ABC-1234"
              maxLength={20}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Apodo (Opcional)</Label>
            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej. Mi Carro"
              maxLength={100}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
