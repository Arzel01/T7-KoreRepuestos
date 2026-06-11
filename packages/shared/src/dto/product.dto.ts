import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

import type { ProductUnit } from '../enums/product-unit.enum';
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
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  brand?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  unit?: ProductUnit;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @Length(1, 200) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @Length(1, 120) brand?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) cost?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(0) minStock?: number;
  @IsOptional() unit?: ProductUnit;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

/**
 * Parámetros de consulta del catálogo público (GET /products).
 * Contrato de wire compartido entre backend (QueryProductsDto lo implementa)
 * y frontend (productsApi.list lo consume) — alineación en compile-time.
 * `categoryIds` viaja como string separado por comas en la URL.
 */
export interface ProductQueryParams extends PaginationParams {
  search?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  unit: ProductUnit;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
