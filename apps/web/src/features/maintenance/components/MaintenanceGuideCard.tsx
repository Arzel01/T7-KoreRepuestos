import { MaintenanceTasksTable } from './MaintenanceTasksTable';

import type { MaintenanceGuideResponse } from '@kore/shared';

interface MaintenanceGuideCardProps {
  guide: MaintenanceGuideResponse;
  isExpanded: boolean;
  onToggle: () => void;
  onAddTask: () => void;
}

export function MaintenanceGuideCard({
  guide,
  isExpanded,
  onToggle,
  onAddTask,
}: MaintenanceGuideCardProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-foreground transition hover:bg-slate-50"
      >
        <div>
          <div className="text-base text-foreground">
            {guide.brandName} · {guide.modelName}
          </div>
          <div className="text-sm text-slate-500">
            {guide.description || 'Guía sin descripción'}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>{guide.tasks.length} tarea(s)</span>
          <span
            className={`inline-block transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <MaintenanceTasksTable tasks={guide.tasks} onAddTask={onAddTask} />
      </div>
    </div>
  );
}
