import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateTaskPartDto {
  @ApiProperty({ example: 7, description: 'ID del producto requerido para la tarea.' })
  @IsInt()
  @IsPositive()
  productId!: number;

  @ApiPropertyOptional({ example: 1, description: 'Cantidad del producto. Por defecto 1.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
