import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';

import { useCategories } from '../hooks/useCategories';

export function CategoryNav(): JSX.Element {
  const { categories, loading } = useCategories();

  return (
    <section className="border-b bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground">
          Explorar por categoría
        </h2>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32 shrink-0 rounded-full" />
            ))}
          </div>
        ) : categories.length === 0 ? null : (
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalog?categoryIds=${cat.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                <Tag className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
