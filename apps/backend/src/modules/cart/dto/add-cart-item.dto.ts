import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import type { AddCartItemPayload } from '@kore/shared';

export class AddCartItemDto implements AddCartItemPayload {
  @ApiProperty()
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiPropertyOptional({ default: 1, description: 'Cantidad a añadir (por defecto 1).' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  quantity?: number;
}
