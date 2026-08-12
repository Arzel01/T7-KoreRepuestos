import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

import type { PaginationParams } from '../interfaces/api-response.interface';

export class CreateProductDto {
  @IsString()
  @Length(1, 64)
  sku!: string;

  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @Length(1, 200) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) categoryId?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

/**
 * Parámetros de consulta del catálogo público (GET /products).
 * `categoryIds` viaja como strings separados por comas en la URL;
 * el backend los transforma a enteros antes de consultar.
 */
export interface ProductQueryParams extends PaginationParams {
  search?: string;
  /** Nombre de marca — filtra por compatibilidad real (tabla `compatibilidad`). */
  vehicleBrand?: string;
  /** Nombre de modelo — filtra por compatibilidad real (tabla `compatibilidad`). */
  vehicleModel?: string;
  /** Año (o año desde, si viene con vehicleYearTo) — contra modelos.anio_inicio/anio_fin. */
  vehicleYear?: number;
  /** Año hasta — solo tiene efecto junto con vehicleYear. */
  vehicleYearTo?: number;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface ProductResponse {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number | null;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  /**
   * Nombre con los términos buscados resaltados (`ts_headline`, `<mark>…</mark>`).
   * Solo presente en resultados de búsqueda; ausente en listados sin `search`.
   */
  highlight?: string;
}

export interface ProductDetailResponse extends ProductResponse {
  images?: ProductImageResponse[];
  technicalSheet?: TechnicalSheetEntryResponse[];
}

export interface ProductImageResponse {
  id: number;
  productId: number;
  url: string;
  isPrimary: boolean;
}

export interface TechnicalSheetEntryResponse {
  id: number;
  productId: number;
  attribute: string;
  value: string;
}

export interface ReviewResponse {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title?: string;
  comment?: string;
  helpfulVotes: number;
  createdAt: string;
}

export interface PaginatedReviewsResponse {
  items: ReviewResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  averageRating: number | null;
}

export interface CompatibilityItem {
  modelId: number;
  modelName: string;
  brandName: string;
  yearStart: number;
  yearEnd: number;
}

export interface RecommendedProductResponse {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  categoryId?: number | null;
  imageUrl?: string;
}

export interface MileagePartResponse {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
  taskDescription: string;
  mileageInterval: number;
  isCritical: boolean;
}
