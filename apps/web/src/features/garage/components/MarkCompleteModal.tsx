import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { extractApiErrorMessage } from '@/lib/api-client';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

interface Props {
  open: boolean;
  planId: number;
  currentMileage: number;
  onClose: () => void;
  onConfirm: (
    planId: number,
    mileage: number,
    notes?: string,
    completedAt?: string,
  ) => Promise<void>;
}

export function MarkCompleteModal({ open, planId, currentMileage, onClose, onConfirm }: Props) {
  const [notes, setNotes] = useState('');
  const [completedAt, setCompletedAt] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      await onConfirm(planId, currentMileage, notes.trim() || undefined, completedAt);
      setNotes('');
      setCompletedAt(today());
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
          <DialogTitle>Marcar Mantenimiento como Completado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Fecha del servicio</Label>
            <Input
              type="date"
              value={completedAt}
              max={today()}
              onChange={(e) => setCompletedAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega notas sobre el servicio realizado..."
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-success-foreground hover:bg-success-foreground/90 text-white"
            onClick={() => void handleConfirm()}
            disabled={saving}
          >
            {saving ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
