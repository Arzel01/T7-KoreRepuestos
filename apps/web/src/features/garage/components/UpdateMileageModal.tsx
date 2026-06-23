import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractApiErrorMessage } from '@/lib/api-client';

interface Props {
  open: boolean;
  currentMileage: number;
  onClose: () => void;
  onSave: (mileage: number) => Promise<void>;
}

export function UpdateMileageModal({ open, currentMileage, onClose, onSave }: Props) {
  const [value, setValue] = useState(currentMileage.toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const km = Number(value);
    if (isNaN(km) || km < currentMileage) {
      setError(`El kilometraje no puede ser menor al actual (${currentMileage} km).`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(km);
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
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Actualizar Kilometraje</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Kilometraje Actual</Label>
            <Input
              type="number"
              min={currentMileage}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
