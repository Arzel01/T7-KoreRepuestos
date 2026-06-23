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

import type { CreateVehicleDto } from '@kore/shared';

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateVehicleDto) => Promise<unknown>;
}

export function AddVehicleModal({ open, onClose, onSave }: Props) {
  const { brands } = useBrands();
  const [brandId, setBrandId] = useState<number | null>(null);
  const { models } = useModels(brandId);

  const [modelId, setModelId] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [currentMileage, setCurrentMileage] = useState('');
  const [alias, setAlias] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setBrandId(null);
    setModelId(null);
    setYear(null);
    setCurrentMileage('');
    setAlias('');
    setError(null);
  }

  async function handleSave() {
    if (!brandId || !modelId || !year) {
      setError('Selecciona marca, modelo y año.');
      return;
    }
    const km = Number(currentMileage);
    if (!currentMileage || isNaN(km) || km < 0) {
      setError('El kilometraje actual es obligatorio y debe ser un número válido.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        brandId,
        modelId,
        year,
        currentMileage: km,
        alias: alias.trim() || undefined,
      });
      reset();
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
          <DialogTitle>Agregar Nuevo Vehículo</DialogTitle>
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
            <Label>
              Kilometraje Actual <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={currentMileage}
              onChange={(e) => setCurrentMileage(e.target.value)}
              placeholder="Ej. 45000"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Apodo (Opcional)</Label>
            <Input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej. Mi Carro"
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
            {saving ? 'Guardando...' : 'Guardar Vehículo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
