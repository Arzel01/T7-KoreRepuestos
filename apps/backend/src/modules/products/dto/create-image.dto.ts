import { IsInt, IsBoolean, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateImageDto {
  @IsString()
  @Length(1, 200)
  url_imagen!: string;

  @IsInt({ message: 'id_producto debe ser un entero (id de producto)' })
  @Min(1)
  id_producto!: number;

  @IsOptional()
  @IsBoolean({ message: 'es_principal debe ser booleano' })
  es_principal?: boolean;
}
