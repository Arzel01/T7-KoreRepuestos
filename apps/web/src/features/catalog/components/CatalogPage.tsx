import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { useCatalogProducts } from '../hooks/useCatalogProducts';
import { useCategories } from '../hooks/useCategories';

import { CatalogNavbar } from './CatalogNavbar';
import { CatalogPagination } from './CatalogPagination';
import { CatalogSidebar } from './CatalogSidebar';
import { ProductGrid } from './ProductGrid';
import { ResultsHeader } from './ResultsHeader';

/**
 * Catálogo público de repuestos — página principal del storefront (`/`).
 *
 * Layout mobile-first:
 *   · Móvil: filtros ocultos tras el botón "Filtros" (Drawer/Sheet).
 *   · Desktop (lg+): sidebar fija de 280px + grilla de resultados.
 *
 * La clase `.storefront` activa el tema claro/azul scoped (ver index.css);
 * `min-h-screen bg-muted` cubre el fondo oscuro global del <body>.
 */
export function CatalogPage(): JSX.Element {
  const filters = useCatalogFilters();
  const { categories, loading: categoriesLoading } = useCategories();
  const { data, loading, error, retry } = useCatalogProducts(filters.applied, filters.appliedKey);

  const sidebar = (
    <CatalogSidebar
      filters={filters}
      categories={categories}
      categoriesLoading={categoriesLoading}
    />
  );

  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar initialSearch={filters.applied.search ?? ''} onSearch={filters.submitSearch} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border bg-background p-5">{sidebar}</div>
        </aside>

        {/* Contenido */}
        <main className="space-y-6">
          <div className="flex items-center gap-3">
            {/* Filtros móviles: drawer */}
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
                  <SheetDescription>Refine los resultados del catálogo.</SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-8">{sidebar}</div>
              </SheetContent>
            </Sheet>

            <div className="flex-1">
              <ResultsHeader total={data?.total ?? null} loading={loading} />
            </div>
          </div>

          <ProductGrid
            items={data?.items ?? null}
            loading={loading}
            error={error}
            onRetry={retry}
            onClearFilters={filters.clearAll}
            hasActiveFilters={filters.hasActiveFilters}
          />

          {data && (
            <CatalogPagination
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={filters.setPage}
            />
          )}
        </main>
      </div>
    </div>
  );
}
