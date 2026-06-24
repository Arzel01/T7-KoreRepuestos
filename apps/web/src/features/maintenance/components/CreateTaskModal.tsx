import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { MaintenanceGuideResponse } from '@kore/shared';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGuide: MaintenanceGuideResponse | undefined;
  newTaskDescription: string;
  newTaskMileage: string;
  newTaskMonths: string;
  newTaskIsCritical: boolean;
  taskFormError: string | null;
  savingTask: boolean;
  onDescriptionChange: (value: string) => void;
  onMileageChange: (value: string) => void;
  onMonthsChange: (value: string) => void;
  onIsCriticalChange: (value: boolean) => void;
  onSubmit: () => void;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  selectedGuide,
  newTaskDescription,
  newTaskMileage,
  newTaskMonths,
  newTaskIsCritical,
  taskFormError,
  savingTask,
  onDescriptionChange,
  onMileageChange,
  onMonthsChange,
  onIsCriticalChange,
  onSubmit,
}: CreateTaskModalProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar tarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Guía</Label>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {selectedGuide?.description ?? 'Guía seleccionada'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción de la tarea</Label>
            <Input
              value={newTaskDescription}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Ej. Cambio de aceite"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Intervalo km</Label>
              <Input
                type="number"
                min={0}
                value={newTaskMileage}
                onChange={(event) => onMileageChange(event.target.value)}
                placeholder="10000"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Intervalo meses</Label>
              <Input
                type="number"
                min={0}
                value={newTaskMonths}
                onChange={(event) => onMonthsChange(event.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              checked={newTaskIsCritical}
              onCheckedChange={(checked) => onIsCriticalChange(Boolean(checked))}
            />
            <span className="text-sm text-slate-700">Marcar como tarea crítica</span>
          </div>

          {taskFormError && <p className="text-sm text-red-600">{taskFormError}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={savingTask}>
            {savingTask ? 'Guardando...' : 'Crear tarea'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
