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
