import { useState } from 'react';

import type {
  CreateMaintenanceGuideDto,
  CreateMaintenanceTaskDto,
  CreateTaskProductDto,
} from '../../../../../../packages/shared/src/dto/maintenance/create-maintenance-guide.dto';

export interface ModelOption {
  id: number;
  label: string; // e.g. "Toyota Corolla (2018–2023)"
}

export interface ProductOption {
  id: number;
  sku: string;
  nombre: string;
}

interface Props {
  modelOptions: ModelOption[];
  productOptions: ProductOption[];
  onSubmit: (payload: CreateMaintenanceGuideDto) => void | Promise<void>;
  isLoading?: boolean;
}

const emptyProduct = (): CreateTaskProductDto => ({ productId: 0, quantity: 1 });

const emptyTask = (): CreateMaintenanceTaskDto => ({
  taskDescription: '',
  mileageInterval: 0,
  products: [emptyProduct()],
});

export function CreateMaintenanceGuideForm({
  modelOptions,
  productOptions,
  onSubmit,
  isLoading = false,
}: Props) {
  const [modelId, setModelId] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<CreateMaintenanceTaskDto[]>([emptyTask()]);

  const updateTask = (taskIdx: number, patch: Partial<CreateMaintenanceTaskDto>) => {
    setTasks((prev) => prev.map((t, i) => (i === taskIdx ? { ...t, ...patch } : t)));
  };

  const addTask = () => setTasks((prev) => [...prev, emptyTask()]);

  const removeTask = (taskIdx: number) => setTasks((prev) => prev.filter((_, i) => i !== taskIdx));

  const updateProduct = (
    taskIdx: number,
    prodIdx: number,
    patch: Partial<CreateTaskProductDto>,
  ) => {
    setTasks((prev) =>
      prev.map((t, i) =>
        i !== taskIdx
          ? t
          : {
              ...t,
              products: t.products.map((p, j) => (j === prodIdx ? { ...p, ...patch } : p)),
            },
      ),
    );
  };

  const addProduct = (taskIdx: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === taskIdx ? { ...t, products: [...t.products, emptyProduct()] } : t)),
    );
  };

  const removeProduct = (taskIdx: number, prodIdx: number) => {
    setTasks((prev) =>
      prev.map((t, i) =>
        i !== taskIdx ? t : { ...t, products: t.products.filter((_, j) => j !== prodIdx) },
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateMaintenanceGuideDto = { modelId, description, tasks };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-semibold text-gray-800">Nueva Guía de Mantenimiento</h2>

      {/* Modelo */}
      <div className="space-y-1">
        <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">
          Modelo de vehículo
        </label>
        <select
          required
          id="model-select"
          value={modelId}
          onChange={(e) => setModelId(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0} disabled>
            Seleccione un modelo…
          </option>
          {modelOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Descripción */}
      <div className="space-y-1">
        <label htmlFor="guide-description" className="block text-sm font-medium text-gray-700">
          Descripción general
        </label>
        <textarea
          required
          id="guide-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Mantenimiento preventivo cada 10.000 km"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Tareas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Tareas ({tasks.length})
          </h3>
          <button
            type="button"
            onClick={addTask}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Agregar tarea
          </button>
        </div>

        {tasks.map((task, tIdx) => (
          <div key={tIdx} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
            {/* Cabecera tarea */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Tarea {tIdx + 1}
              </span>
              {tasks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTask(tIdx)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar tarea
                </button>
              )}
            </div>

            {/* Descripción tarea */}
            <div className="space-y-1">
              <label
                htmlFor={`task-desc-${tIdx}`}
                className="block text-sm font-medium text-gray-700"
              >
                Descripción de la tarea
              </label>
              <input
                required
                id={`task-desc-${tIdx}`}
                type="text"
                value={task.taskDescription}
                onChange={(e) => updateTask(tIdx, { taskDescription: e.target.value })}
                placeholder="Ej: Cambio de aceite y filtro"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Intervalo kilometraje */}
            <div className="space-y-1">
              <label
                htmlFor={`task-mileage-${tIdx}`}
                className="block text-sm font-medium text-gray-700"
              >
                Intervalo (km)
              </label>
              <input
                required
                id={`task-mileage-${tIdx}`}
                type="number"
                min={1}
                value={task.mileageInterval || ''}
                onChange={(e) => updateTask(tIdx, { mileageInterval: Number(e.target.value) })}
                placeholder="10000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Repuestos / Productos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Repuestos</span>
                <button
                  type="button"
                  onClick={() => addProduct(tIdx)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Agregar repuesto
                </button>
              </div>

              {task.products.map((prod, pIdx) => (
                <div key={pIdx} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                  <select
                    required
                    value={prod.productId}
                    onChange={(e) =>
                      updateProduct(tIdx, pIdx, {
                        productId: Number(e.target.value),
                      })
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0} disabled>
                      Seleccionar repuesto…
                    </option>
                    {productOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.nombre}
                      </option>
                    ))}
                  </select>

                  <input
                    required
                    type="number"
                    min={1}
                    value={prod.quantity}
                    onChange={(e) =>
                      updateProduct(tIdx, pIdx, {
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Cantidad"
                  />

                  {task.products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(tIdx, pIdx)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                      title="Quitar repuesto"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Guardando…' : 'Crear Guía de Mantenimiento'}
      </button>
    </form>
  );
}
