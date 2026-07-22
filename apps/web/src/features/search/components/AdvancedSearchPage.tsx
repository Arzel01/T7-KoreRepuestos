import { Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';
import { CatalogPagination } from '@/features/catalog/components/CatalogPagination';
import { CategoryFilter } from '@/features/catalog/components/CategoryFilter';
import { PriceFilter } from '@/features/catalog/components/PriceFilter';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { ResultsHeader } from '@/features/catalog/components/ResultsHeader';
import { VehicleSelector } from '@/features/catalog/components/VehicleSelector';
import { useCategories } from '@/features/catalog/hooks/useCategories';

import { useAdvancedSearch } from '../hooks/useAdvancedSearch';

export function AdvancedSearchPage(): JSX.Element {
  const { filters, products } = useAdvancedSearch();
  const { categories, loading: categoriesLoading } = useCategories();

  const filterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filtros</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={filters.clearAll}
          disabled={!filters.hasActiveFilters}
          className="h-8 px-3 text-xs"
        >
          Limpiar filtros
        </Button>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold">Vehículo compatible</h3>
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
          resetTrigger={0}
        />
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 text-sm font-semibold">Precio</h3>
        <PriceFilter
          draft={filters.draftPrice}
          onDraftChange={filters.setDraftPrice}
          onApply={filters.applyPrice}
        />
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 text-sm font-semibold">Disponibilidad</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="adv-in-stock"
            checked={filters.inStock}
            onCheckedChange={(c) => filters.setInStock(c === true)}
          />
          <Label htmlFor="adv-in-stock" className="cursor-pointer text-sm font-normal">
            Solo en stock
          </Label>
        </div>
      </section>
    </div>
  );

  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar initialSearch={filters.applied.search ?? ''} onSearch={filters.submitSearch} />

      {/* Hero de búsqueda */}
      <div className="bg-background border-b px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="size-4" aria-hidden="true" />
            <h1 className="text-sm font-semibold uppercase tracking-wide">Búsqueda avanzada</h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Combine texto, vehículo, categoría, precio y disponibilidad para encontrar exactamente
            lo que necesita.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10 lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border bg-background p-6">{filterPanel}</div>
        </aside>

        {/* Contenido */}
        <main className="space-y-6">
          <div className="flex items-center gap-3">
            {/* Filtros móviles */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 lg:hidden">
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>Refine los resultados de la búsqueda.</SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-8">{filterPanel}</div>
              </SheetContent>
            </Sheet>

            <div className="flex-1">
              <ResultsHeader total={products.data?.total ?? null} loading={products.loading} />
            </div>
          </div>

          <ProductGrid
            items={products.data?.items ?? null}
            loading={products.loading}
            error={products.error}
            onRetry={products.retry}
            onClearFilters={filters.clearAll}
            hasActiveFilters={filters.hasActiveFilters}
          />

          {products.data && (
            <CatalogPagination
              page={products.data.page}
              totalPages={products.data.totalPages}
              onPageChange={filters.setPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
