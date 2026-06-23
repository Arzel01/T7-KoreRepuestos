import { PackageSearch, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { ProductCard } from './ProductCard';

import type { ProductResponse } from '@kore/shared';

interface ProductGridProps {
  items: ProductResponse[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

/** Grilla responsive del catálogo con estados de carga, error y vacío. */
export function ProductGrid({
  items,
  loading,
  error,
  onRetry,
  onClearFilters,
  hasActiveFilters,
}: ProductGridProps): JSX.Element {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-44 w-full rounded-none" />
            <CardContent className="space-y-2 pt-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
            <CardFooter className="justify-between pt-0">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-9 w-28" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
      >
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RotateCw className="size-4" aria-hidden="true" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center">
        <PackageSearch className="size-12 text-muted-foreground/50" aria-hidden="true" />
        <div>
          <p className="font-medium">No se encontraron productos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pruebe ajustando los filtros o el término de búsqueda.
          </p>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
