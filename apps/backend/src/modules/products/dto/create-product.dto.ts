import { ProductUnit } from '@kore/shared';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';

/**
 * Validación estricta del payload para `POST /api/products`.
 *
 * Reglas de Sprint 1 (US#45):
 *   · `price` > 0  (Min 0.01)        — no se aceptan productos gratis ni con precio 0
 *   · `stock` > 0  (Min 1)           — no se publica un repuesto sin existencias
 *   · `sku`   no vacío, único en BD  — verificado además a nivel de servicio
 *
 * El interceptor global `ValidationPipe` (registrado en `main.ts` con
 * `whitelist + forbidNonWhitelisted + transform`) garantiza:
 *   · Rechazo de propiedades no declaradas (anti payload pollution).
 *   · Conversión automática de strings numéricos a `number`.
 */
export class CreateProductDto {
  @IsString()
  @Length(1, 64, { message: 'El SKU debe tener entre 1 y 64 caracteres' })
  @Matches(/^[A-Z0-9-]+$/i, {
    message: 'El SKU solo admite letras, dígitos y guiones',
  })
  sku!: string;

  @IsString()
  @Length(1, 200, { message: 'El nombre debe tener entre 1 y 200 caracteres' })
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'categoryId debe ser un UUID v4 válido' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  brand?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price debe ser numérico con hasta 2 decimales' })
  @Min(0.01, { message: 'El precio debe ser mayor que cero' })
  price!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El costo, si se indica, debe ser mayor que cero' })
  cost?: number;

  @IsInt({ message: 'stock debe ser un entero' })
  @Min(1, { message: 'El stock debe ser mayor que cero' })
  stock!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsEnum(ProductUnit, { message: 'Unidad inválida' })
  unit?: ProductUnit;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  imageUrl?: string;
}
