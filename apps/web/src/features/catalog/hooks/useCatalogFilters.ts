import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { ProductQueryParams } from '@kore/shared';

export interface CatalogFiltersState {
  /** Filtros APLICADOS, parseados desde la URL — lo que realmente se consulta. */
  applied: ProductQueryParams;
  /** Serialización estable de la URL — dependencia barata para refetch. */
  appliedKey: string;
  selectedCategoryIds: string[];
  inStock: boolean;
  /** Borrador local de precio: solo se aplica con el botón "Buscar". */
  draftPrice: { min: string; max: string };
  hasActiveFilters: boolean;
  setDraftPrice: (price: { min: string; max: string }) => void;
  applyPrice: () => void;
  toggleCategory: (id: string) => void;
  setInStock: (value: boolean) => void;
  submitSearch: (term: string) => void;
  setPage: (page: number) => void;
  clearAll: () => void;
}

/**
 * Estado de filtros del catálogo con la URL como única fuente de verdad
 * de lo aplicado: los filtros sobreviven al reload, el botón atrás funciona
 * y la URL es compartible.
 *
 * UX según el diseño:
 *   · Checkboxes (categorías, "Solo en stock") aplican al instante.
 *   · Precio min/max es borrador local → aplica con el botón "Buscar".
 *   · Búsqueda del navbar aplica al submit del formulario.
 *   · Cualquier cambio de filtro resetea a la página 1.
 */
export function useCatalogFilters(): CatalogFiltersState {
  const [searchParams, setSearchParams] = useSearchParams();

  const applied = useMemo<ProductQueryParams>(() => {
    const search = searchParams.get('search') ?? undefined;
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean);
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = searchParams.get('page');

    return {
      search,
      categoryIds: categoryIds?.length ? categoryIds : undefined,
      minPrice: minPrice !== null ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== null ? Number(maxPrice) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      page: page !== null ? Number(page) : undefined,
    };
  }, [searchParams]);

  const [draftPrice, setDraftPrice] = useState<{ min: string; max: string }>(() => ({
    min: searchParams.get('minPrice') ?? '',
    max: searchParams.get('maxPrice') ?? '',
  }));

  /**
   * Escribe cambios en la URL omitiendo valores vacíos (URLs limpias y el
   * backend nunca recibe params vacíos). Salvo que se indique lo contrario,
   * todo cambio resetea `page`.
   */
  const update = useCallback(
    (changes: Record<string, string | undefined>, { keepPage = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!keepPage) next.delete('page');
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const selectedCategoryIds = useMemo(() => applied.categoryIds ?? [], [applied.categoryIds]);

  const toggleCategory = useCallback(
    (id: string) => {
      const next = selectedCategoryIds.includes(id)
        ? selectedCategoryIds.filter((c) => c !== id)
        : [...selectedCategoryIds, id];
      update({ categoryIds: next.length ? next.join(',') : undefined });
    },
    [selectedCategoryIds, update],
  );

  const setInStock = useCallback(
    (value: boolean) => update({ inStock: value ? 'true' : undefined }),
    [update],
  );

  const submitSearch = useCallback(
    (term: string) => update({ search: term.trim() || undefined }),
    [update],
  );

  const applyPrice = useCallback(() => {
    update({
      minPrice: draftPrice.min.trim() || undefined,
      maxPrice: draftPrice.max.trim() || undefined,
    });
  }, [draftPrice, update]);

  const setPage = useCallback(
    (page: number) => update({ page: page > 1 ? String(page) : undefined }, { keepPage: true }),
    [update],
  );

  const clearAll = useCallback(() => {
    setDraftPrice({ min: '', max: '' });
    setSearchParams(new URLSearchParams(), { replace: false });
  }, [setSearchParams]);

  const hasActiveFilters = [...searchParams.keys()].some((k) => k !== 'page');

  return {
    applied,
    appliedKey: searchParams.toString(),
    selectedCategoryIds,
    inStock: applied.inStock === true,
    draftPrice,
    hasActiveFilters,
    setDraftPrice,
    applyPrice,
    toggleCategory,
    setInStock,
    submitSearch,
    setPage,
    clearAll,
  };
}
