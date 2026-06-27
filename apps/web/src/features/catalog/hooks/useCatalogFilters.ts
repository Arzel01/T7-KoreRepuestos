import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const LS_KEY = 'kore_catalog_filters';

import type { ProductQueryParams } from '@kore/shared';

export interface VehicleFilters {
  brand: string;
  model: string;
  type: string;
  /** Año de inicio del rango (o año único si yearTo está vacío). */
  year: string;
  /** Año de fin del rango. Solo visible en la UI cuando `year` tiene valor. */
  yearTo: string;
}

export interface CatalogFiltersState {
  /** Filtros APLICADOS, parseados desde la URL — lo que realmente se consulta. */
  applied: ProductQueryParams;
  /** Serialización estable de la URL — dependencia barata para refetch. */
  appliedKey: string;
  selectedCategoryIds: string[];
  inStock: boolean;
  vehicle: VehicleFilters;
  /** Borrador local de precio: solo se aplica con el botón "Buscar". */
  draftPrice: { min: string; max: string };
  hasActiveFilters: boolean;
  setDraftPrice: (price: { min: string; max: string }) => void;
  applyPrice: () => void;
  toggleCategory: (id: string) => void;
  clearCategories: () => void;
  setInStock: (value: boolean) => void;
  setVehicle: (field: keyof VehicleFilters, value: string) => void;
  submitSearch: (term: string) => void;
  setPage: (page: number) => void;
  clearAll: () => void;
}

/**
 * Compone el `search` que recibe el backend (solo tipo de vehículo por ahora).
 *
 * Marca, modelo y año NO van aquí — se envían como `vehicleBrand`/
 * `vehicleModel`/`vehicleYear`/`vehicleYearTo` y se filtran en el backend vía
 * la tabla `compatibilidad` (FK real a `modelos`/`marcas`), no por
 * coincidencia de texto contra el nombre del producto.
 */
function composeSearch(
  manualSearch: string | undefined,
  vehicle: VehicleFilters,
): string | undefined {
  if (manualSearch?.trim()) return manualSearch.trim();
  return vehicle.type.trim() || undefined;
}

/**
 * Estado de filtros del catálogo con la URL como única fuente de verdad.
 *
 * UX de rango de años:
 *   · El selector "Año desde" siempre es visible.
 *   · El selector "Año hasta" aparece solo cuando "Año desde" tiene valor.
 *   · Al cambiar "Año desde", si el nuevo valor es mayor que "Año hasta"
 *     actual, se limpia "Año hasta" para evitar rangos inválidos (2024–2018).
 *   · Al limpiar "Año desde", también se limpia "Año hasta".
 */
export function useCatalogFilters(): CatalogFiltersState {
  const [searchParams, setSearchParams] = useSearchParams();

  // Restore persisted filters on first mount when URL has no params
  useEffect(() => {
    if (searchParams.toString()) return;
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setSearchParams(new URLSearchParams(saved), { replace: true });
    } catch {
      // localStorage unavailable — silently skip
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters (excluding page) whenever params change
  useEffect(() => {
    try {
      const withoutPage = new URLSearchParams(searchParams);
      withoutPage.delete('page');
      if (withoutPage.toString()) {
        localStorage.setItem(LS_KEY, withoutPage.toString());
      } else {
        localStorage.removeItem(LS_KEY);
      }
    } catch {
      // localStorage unavailable — silently skip
    }
  }, [searchParams]);

  const vehicle = useMemo<VehicleFilters>(
    () => ({
      brand: searchParams.get('vehicleBrand') ?? '',
      model: searchParams.get('vehicleModel') ?? '',
      type: searchParams.get('vehicleType') ?? '',
      year: searchParams.get('vehicleYear') ?? '',
      yearTo: searchParams.get('vehicleYearTo') ?? '',
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
      search: composeSearch(manualSearch, vehicle),
      vehicleBrand: vehicle.brand || undefined,
      vehicleModel: vehicle.model || undefined,
      vehicleYear: vehicle.year ? Number(vehicle.year) : undefined,
      vehicleYearTo: vehicle.yearTo ? Number(vehicle.yearTo) : undefined,
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

  // Resincroniza el borrador cuando minPrice/maxPrice cambian por una vía
  // externa al formulario (atrás/adelante del navegador, "Limpiar filtros").
  // Depender de los valores ya extraídos (no de `searchParams` entero) evita
  // pisar lo que el usuario esté escribiendo cuando cambia un filtro distinto.
  const urlMinPrice = searchParams.get('minPrice') ?? '';
  const urlMaxPrice = searchParams.get('maxPrice') ?? '';
  useEffect(() => {
    setDraftPrice({ min: urlMinPrice, max: urlMaxPrice });
  }, [urlMinPrice, urlMaxPrice]);

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

  const clearCategories = useCallback(() => {
    update({ categoryIds: undefined });
  }, [update]);

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
        yearTo: 'vehicleYearTo',
      };

      const changes: Record<string, string | undefined> = {
        [urlKey[field]]: value || undefined,
      };

      if (field === 'brand') {
        // Cambiar marca invalida el modelo seleccionado
        changes.vehicleModel = undefined;
      }

      if (field === 'year') {
        if (!value) {
          // Si se limpia yearFrom, también limpiar yearTo
          changes.vehicleYearTo = undefined;
        } else {
          // Si el nuevo yearFrom es mayor que yearTo actual, limpiar yearTo
          const newFrom = parseInt(value, 10);
          const currentTo = parseInt(searchParams.get('vehicleYearTo') ?? '', 10);
          if (!isNaN(currentTo) && newFrom > currentTo) {
            changes.vehicleYearTo = undefined;
          }
        }
      }

      update(changes);
    },
    [update, searchParams],
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
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
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
    clearCategories,
    setInStock,
    setVehicle,
    submitSearch,
    setPage,
    clearAll,
  };
}
