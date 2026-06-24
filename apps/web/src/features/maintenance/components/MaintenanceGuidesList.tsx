import { MaintenanceGuideCard } from './MaintenanceGuideCard';

import type { MaintenanceGuideResponse } from '@kore/shared';

interface MaintenanceGuidesListProps {
  guides: MaintenanceGuideResponse[];
  loading: boolean;
  expandedIds: number[];
  onToggleGuide: (id: number) => void;
  onOpenTaskModal: (guideId: number) => void;
}

export function MaintenanceGuidesList({
  guides,
  loading,
  expandedIds,
  onToggleGuide,
  onOpenTaskModal,
}: MaintenanceGuidesListProps): JSX.Element {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      {loading && (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-sm text-slate-500">
          Cargando tareas de mantenimiento…
        </div>
      )}

      {!loading && guides.length === 0 && (
        <div className="rounded-3xl bg-slate-50 p-8 text-center text-sm text-slate-500">
          No se encontraron tareas con los filtros seleccionados.
        </div>
      )}

      {!loading &&
        guides.map((guide) => {
          const isExpanded = expandedIds.includes(guide.id);
          return (
            <MaintenanceGuideCard
              key={guide.id}
              guide={guide}
              isExpanded={isExpanded}
              onToggle={() => onToggleGuide(guide.id)}
              onAddTask={() => onOpenTaskModal(guide.id)}
            />
          );
        })}
    </section>
  );
}
