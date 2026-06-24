import { Button } from '@/components/ui/button';

interface MaintenanceHeaderProps {
  onOpenGuideModal: () => void;
}

export function MaintenanceHeader({ onOpenGuideModal }: MaintenanceHeaderProps): JSX.Element {
  return (
    <header className="flex flex-col gap-4 rounded-3xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Panel administrativo
        </p>
        <h1 className="text-4xl font-semibold text-foreground">Gestión de Mantenimiento</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Configura las tareas de mantenimiento por vehículo y kilometraje.
        </p>
      </div>
      <Button
        type="button"
        onClick={onOpenGuideModal}
        className="inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold shadow-sm transition-colors hover:bg-primary/90"
      >
        <span className="text-base">+</span>
        <span>Nueva Guía</span>
      </Button>
    </header>
  );
}
