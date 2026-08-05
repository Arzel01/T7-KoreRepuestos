import { IsObject, IsString, Length } from 'class-validator';

/**
 * Parámetros de una búsqueda del catálogo. Coincide con lo que el frontend
 * serializa en la URL (`useCatalogFilters`), de modo que guardar y re-aplicar
 * es simétrico.
 */
export interface SavedSearchParams {
  search?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleType?: string;
  vehicleYear?: number;
  vehicleYearTo?: number;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export class CreateSavedSearchDto {
  @IsString()
  @Length(1, 120)
  nombre!: string;

  /** Se persiste tal cual como jsonb; el frontend controla su forma. */
  @IsObject()
  parametros!: SavedSearchParams;
}

export interface SavedSearchResponse {
  id: number;
  nombre: string;
  parametros: SavedSearchParams;
  createdAt: string;
}
