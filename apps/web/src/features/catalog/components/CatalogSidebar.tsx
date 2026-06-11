import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { CategoryFilter } from './CategoryFilter';
import { PriceFilter } from './PriceFilter';
import { VehicleSelector } from './VehicleSelector';

import type { CatalogFiltersState } from '../hooks/useCatalogFilters';
import type { CategoryResponse } from '@kore/shared';

interface CatalogSidebarProps {
  filters: CatalogFiltersState;
  categories: CategoryResponse[];
  categoriesLoading: boolean;
}

/**
 * Columna de filtros del catálogo. Componente puro de formulario: se
 * renderiza inline en desktop (lg+) y dentro de un <Sheet> en móvil,
 * compartiendo el mismo estado vía props.
 */
export function CatalogSidebar({
  filters,
  categories,
  categoriesLoading,
}: CatalogSidebarProps): JSX.Element {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold">Busca tu vehículo</h3>
        <VehicleSelector />
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 text-sm font-semibold">Categoría</h3>
        <CategoryFilter
          categories={categories}
          loading={categoriesLoading}
          selectedIds={filters.selectedCategoryIds}
          onToggle={filters.toggleCategory}
        />
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 text-sm font-semibold">Costo</h3>
        <PriceFilter
          draft={filters.draftPrice}
          onDraftChange={filters.setDraftPrice}
          onApply={filters.applyPrice}
        />
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 text-sm font-semibold">Estado</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStock}
            onCheckedChange={(checked) => filters.setInStock(checked === true)}
          />
          <Label htmlFor="in-stock" className="cursor-pointer text-sm font-normal">
            Solo en stock
          </Label>
        </div>
      </section>
    </div>
  );
}
