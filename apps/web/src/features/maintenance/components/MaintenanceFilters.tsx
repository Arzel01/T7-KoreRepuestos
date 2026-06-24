import type { MarcaResponse, ModeloResponse } from '@kore/shared';

interface MaintenanceFiltersProps {
  brands: MarcaResponse[];
  models: ModeloResponse[];
  brandId: number | null;
  modelId: number | null;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

export function MaintenanceFilters({
  brands,
  models,
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
}: MaintenanceFiltersProps): JSX.Element {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-500">Marca</span>
          <div className="relative">
            <select
              value={brandId ?? ''}
              onChange={(event) => onBrandChange(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.nombre}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-400">
              ▾
            </span>
          </div>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-500">Modelo</span>
          <div className="relative">
            <select
              value={modelId ?? ''}
              onChange={(event) => onModelChange(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.nombre}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-400">
              ▾
            </span>
          </div>
        </label>
      </div>
    </section>
  );
}
