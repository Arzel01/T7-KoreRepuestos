import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Paginación simple Anterior/Siguiente. Se oculta con una sola página. */
export function CatalogPagination({
  page,
  totalPages,
  onPageChange,
}: CatalogPaginationProps): JSX.Element | null {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-4" aria-label="Paginación del catálogo">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="gap-1"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="gap-1"
      >
        Siguiente
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
