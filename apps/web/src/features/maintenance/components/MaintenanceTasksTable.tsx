import type { MaintenanceTaskResponse } from '@kore/shared';

interface MaintenanceTasksTableProps {
  tasks: MaintenanceTaskResponse[];
  onAddTask: () => void;
}

export function MaintenanceTasksTable({
  tasks,
  onAddTask,
}: MaintenanceTasksTableProps): JSX.Element {
  return (
    <div className="border-t border-slate-200 px-6 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">Tareas de la guía</div>
        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex h-9 items-center rounded-lg bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20"
        >
          + Añadir tarea
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
          Aún no hay tareas en esta guía.
        </div>
      ) : (
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-xs uppercase tracking-[0.2em]">
              <th className="px-4 py-3 font-semibold">Descripción</th>
              <th className="px-4 py-3 font-semibold">Intervalo km</th>
              <th className="px-4 py-3 font-semibold">Intervalo meses</th>
              <th className="px-4 py-3 font-semibold">Crítico</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-slate-200 last:border-b-0">
                <td className="px-4 py-4 align-top text-sm text-foreground">{task.description}</td>
                <td className="px-4 py-4 align-top text-sm text-foreground">
                  {task.mileageInterval.toLocaleString('es-CL')} km
                </td>
                <td className="px-4 py-4 align-top text-sm text-slate-500">
                  {task.monthInterval ? `${task.monthInterval} mes(es)` : '—'}
                </td>
                <td className="px-4 py-4 align-top text-sm">
                  {task.isCritical ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                      Sí
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 align-top text-right text-sm text-slate-500">
                  <button
                    type="button"
                    aria-label="Editar"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                  >
                    ✎
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
