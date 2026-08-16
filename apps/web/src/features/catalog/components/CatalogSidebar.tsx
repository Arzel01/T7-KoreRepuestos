import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { CategoryFilter } from './CategoryFilter';
import { PriceFilter } from './PriceFilter';
import { SavedSearches } from './SavedSearches';
import { VehicleSelector } from './VehicleSelector';

import type { CatalogFiltersState } from '../hooks/useCatalogFilters';
import type { UseSavedSearches } from '../hooks/useSavedSearches';
import type { CategoryResponse } from '@kore/shared';

interface CatalogSidebarProps {
  filters: CatalogFiltersState;
  categories: CategoryResponse[];
  categoriesLoading: boolean;
  /**
   * Se recibe ya resuelto desde `CatalogPage` (no se llama `useSavedSearches`
   * acá) porque este componente se monta dos veces en paralelo — sidebar
   * desktop y drawer móvil — y ambas copias deben compartir un único fetch.
   */
  savedSearches: UseSavedSearches;
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
  savedSearches,
}: CatalogSidebarProps): JSX.Element {
  const [categoryFilterResetKey, setCategoryFilterResetKey] = useState(0);

  const handleClearFilters = () => {
    filters.clearAll();
    setCategoryFilterResetKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filtros</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          disabled={!filters.hasActiveFilters}
          className="h-8 px-3 text-xs"
        >
          Limpiar filtros
        </Button>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold">Busca tu vehículo</h3>
        <VehicleSelector vehicle={filters.vehicle} onVehicleChange={filters.setVehicle} />
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 text-sm font-semibold">Categoría</h3>
        <CategoryFilter
          categories={categories}
          loading={categoriesLoading}
          selectedIds={filters.selectedCategoryIds}
          onToggle={filters.toggleCategory}
          onClearAll={filters.clearCategories}
          resetTrigger={categoryFilterResetKey}
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

      <Separator />

      <SavedSearches
        currentParams={filters.currentParams}
        canSave={filters.hasActiveFilters}
        onApply={filters.applySavedParams}
        savedSearches={savedSearches.savedSearches}
        loading={savedSearches.loading}
        save={savedSearches.save}
        remove={savedSearches.remove}
      />
    </div>
  );
}
