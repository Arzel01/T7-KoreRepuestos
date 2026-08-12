import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

import type { UpdateCartItemPayload } from '@kore/shared';

export class UpdateCartItemDto implements UpdateCartItemPayload {
  @ApiProperty({ description: 'Nueva cantidad de la línea (>= 1).' })
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}
