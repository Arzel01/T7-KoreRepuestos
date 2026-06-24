import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { MarcaResponse, ModeloResponse } from '@kore/shared';

interface CreateGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: MarcaResponse[];
  modalModels: ModeloResponse[];
  newGuideBrandId: number | null;
  newGuideModelId: number | null;
  newGuideDescription: string;
  guideFormError: string | null;
  savingGuide: boolean;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
}

export function CreateGuideModal({
  open,
  onOpenChange,
  brands,
  modalModels,
  newGuideBrandId,
  newGuideModelId,
  newGuideDescription,
  guideFormError,
  savingGuide,
  onBrandChange,
  onModelChange,
  onDescriptionChange,
  onSubmit,
}: CreateGuideModalProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear nueva guía</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <select
              value={newGuideBrandId ?? ''}
              onChange={(e) => {
                onBrandChange(e.target.value);
                onModelChange('');
              }}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1"
            >
              <option value="">Selecciona marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <select
              value={newGuideModelId ?? ''}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={!newGuideBrandId}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 focus:border-ring focus:ring-1"
            >
              <option value="">Selecciona modelo</option>
              {modalModels.map((m) => (
                <option key={m.id} value={m.id.toString()}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input
              value={newGuideDescription}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Título de la guía"
            />
          </div>

          {guideFormError && <p className="text-sm text-red-600">{guideFormError}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={savingGuide}>
            {savingGuide ? 'Guardando...' : 'Crear guía'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
