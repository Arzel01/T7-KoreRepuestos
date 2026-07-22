import { useCatalogFilters } from '@/features/catalog/hooks/useCatalogFilters';
import { useCatalogProducts } from '@/features/catalog/hooks/useCatalogProducts';

/**
 * Compone los dos hooks del catálogo para la página de búsqueda avanzada.
 * Reutiliza la misma URL-state y la misma lógica de fetch — sin duplicar.
 */
export function useAdvancedSearch() {
  const filters = useCatalogFilters();
  const products = useCatalogProducts(filters.applied, filters.appliedKey);
  return { filters, products };
}
