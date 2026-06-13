import { IsInt, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(1, 64, { message: 'El SKU debe tener entre 1 y 64 caracteres' })
  @Matches(/^[A-Z0-9-]+$/i, { message: 'El SKU solo admite letras, dígitos y guiones' })
  sku!: string;

  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsInt({ message: 'categoryId debe ser un entero (id de categoría)' })
  @Min(1)
  categoryId?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El precio debe ser mayor que cero' })
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;
}
