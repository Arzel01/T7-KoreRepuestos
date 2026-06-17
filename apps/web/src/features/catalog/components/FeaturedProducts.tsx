import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useFeaturedProducts } from '../hooks/useFeaturedProducts';

import { ProductCard } from './ProductCard';

function ProductCardSkeleton(): JSX.Element {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="flex-1 space-y-3 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="space-y-2 px-5 pb-5 pt-2">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
}

export function FeaturedProducts(): JSX.Element {
  const { products, loading, error } = useFeaturedProducts();

  if (error) return <></>;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Productos destacados</h2>
          <Link to="/catalog" className="text-sm font-medium text-primary hover:underline">
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        {!loading && products.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No hay productos disponibles en este momento.
          </p>
        )}
      </div>
    </section>
  );
}
