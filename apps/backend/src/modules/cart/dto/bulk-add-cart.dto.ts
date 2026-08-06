import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { AddCartItemDto } from './add-cart-item.dto';

import type { BulkAddCartPayload } from '@kore/shared';

export class BulkAddCartDto implements BulkAddCartPayload {
  @ApiProperty({ type: [AddCartItemDto], description: 'Repuestos a añadir en lote.' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items!: AddCartItemDto[];
}
