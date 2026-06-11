import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

import type { ProductQueryParams } from '@kore/shared';

const SORTABLE_COLUMNS = ['name', 'price', 'createdAt'] as const;
export type ProductSortBy = (typeof SORTABLE_COLUMNS)[number];

/**
 * Query params del catálogo público (GET /products).
 *
 * `implements ProductQueryParams` garantiza en compile-time que el contrato
 * de wire coincide con lo que el frontend envía (paquete @kore/shared).
 *
 * Los defaults funcionan porque el ValidationPipe global corre con
 * `transform: true` (instancia la clase) — ver `main.ts`.
 */
export class QueryProductsDto implements ProductQueryParams {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  /**
   * Acepta tanto `?categoryIds=a,b,c` como `?categoryIds=a&categoryIds=b`.
   * `filter(Boolean)` descarta vacíos: `?categoryIds=` deviene `[]`,
   * que el repositorio interpreta como "sin filtro" (evita `IN ()` inválido).
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    (Array.isArray(value) ? value : String(value).split(','))
      .map((v: string) => v.trim())
      .filter(Boolean),
  )
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  /**
   * Transform explícito leyendo de `obj` (el query crudo): con
   * `enableImplicitConversion`, `value` llega YA convertido — el string
   * 'false' se vuelve `true` (string no vacío → truthy). `obj.inStock`
   * conserva el string original y permite resolver el booleano bien.
   */
  @IsOptional()
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const raw = obj.inStock;
    return raw === true || raw === 'true' || raw === '1';
  })
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  pageSize: number = 12;

  @IsOptional()
  @IsIn(SORTABLE_COLUMNS)
  sortBy: ProductSortBy = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
