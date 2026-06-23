import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { ProductQueryParams } from '@kore/shared';

export interface VehicleFilters {
  brand: string;
  model: string;
  type: string;
  year: string;
}

export interface CatalogFiltersState {
  /** Filtros APLICADOS, parseados desde la URL — lo que realmente se consulta. */
  applied: ProductQueryParams;
  /** Serialización estable de la URL — dependencia barata para refetch. */
  appliedKey: string;
  selectedCategoryIds: string[];
  inStock: boolean;
  /** Borrador local de precio: solo se aplica con el botón "Buscar". */
  vehicle: VehicleFilters;
  draftPrice: { min: string; max: string };
  hasActiveFilters: boolean;
  setDraftPrice: (price: { min: string; max: string }) => void;
  applyPrice: () => void;
  toggleCategory: (id: string) => void;
  setInStock: (value: boolean) => void;
  setVehicle: (field: keyof VehicleFilters, value: string) => void;
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

function composeSearch(
  manualSearch: string | undefined,
  vehicle: VehicleFilters,
): string | undefined {
  if (manualSearch?.trim()) return manualSearch.trim();
  const terms = [vehicle.brand, vehicle.model, vehicle.type, vehicle.year]
    .map((v) => v.trim())
    .filter(Boolean);
  return terms.length > 0 ? terms.join(' ') : undefined;
}

export function useCatalogFilters(): CatalogFiltersState {
  const [searchParams, setSearchParams] = useSearchParams();

  const vehicle = useMemo<VehicleFilters>(
    () => ({
      brand: searchParams.get('vehicleBrand') ?? '',
      model: searchParams.get('vehicleModel') ?? '',
      type: searchParams.get('vehicleType') ?? '',
      year: searchParams.get('vehicleYear') ?? '',
    }),
    [searchParams],
  );

  const applied = useMemo<ProductQueryParams>(() => {
    const manualSearch = searchParams.get('search') ?? undefined;
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean);
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = searchParams.get('page');

    return {
      // `search` combina texto manual + vehículo según la estrategia de composeSearch
      search: composeSearch(manualSearch, vehicle),
      categoryIds: categoryIds?.length ? categoryIds : undefined,
      minPrice: minPrice !== null ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== null ? Number(maxPrice) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      page: page !== null ? Number(page) : undefined,
    };
  }, [searchParams, vehicle]);

  const [draftPrice, setDraftPrice] = useState<{ min: string; max: string }>(() => ({
    min: searchParams.get('minPrice') ?? '',
    max: searchParams.get('maxPrice') ?? '',
  }));

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

  const setVehicle = useCallback(
    (field: keyof VehicleFilters, value: string) => {
      const urlKey: Record<keyof VehicleFilters, string> = {
        brand: 'vehicleBrand',
        model: 'vehicleModel',
        type: 'vehicleType',
        year: 'vehicleYear',
      };
      const changes: Record<string, string | undefined> = {
        [urlKey[field]]: value || undefined,
      };
      // Si cambia la marca, resetear modelo (ya no es válido para la nueva marca)
      if (field === 'brand') {
        changes.vehicleModel = undefined;
      }
      update(changes);
    },
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
    vehicle,
    draftPrice,
    hasActiveFilters,
    setDraftPrice,
    applyPrice,
    toggleCategory,
    setInStock,
    setVehicle,
    submitSearch,
    setPage,
    clearAll,
  };
}
