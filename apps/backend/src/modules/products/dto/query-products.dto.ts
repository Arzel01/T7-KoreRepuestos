import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

const SORTABLE_COLUMNS = ['name', 'price', 'createdAt'] as const;
export type ProductSortBy = (typeof SORTABLE_COLUMNS)[number];

// Nota: no implementa ProductQueryParams directamente porque categoryIds
// se transforma de string[] (URL) a number[] (schema real) en el DTO.
export class QueryProductsDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  /** Nombre de marca (tabla `marcas`) — filtra vía `compatibilidad`. */
  @IsOptional()
  @IsString()
  @Length(1, 150)
  vehicleBrand?: string;

  /** Nombre de modelo (tabla `modelos`) — filtra vía `compatibilidad`. */
  @IsOptional()
  @IsString()
  @Length(1, 150)
  vehicleModel?: string;

  /**
   * Acepta `?categoryIds=1,2,3` o `?categoryIds=1&categoryIds=2`.
   * Los IDs son enteros (PK integer del schema real).
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    (Array.isArray(value) ? value : String(value).split(','))
      .map((v: string) => parseInt(v.trim(), 10))
      .filter((n: number) => !isNaN(n)),
  )
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  categoryIds?: number[];

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
