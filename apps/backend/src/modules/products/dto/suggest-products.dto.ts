import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class SuggestProductsDto {
  @ApiProperty({ minLength: 2, maxLength: 100 })
  @IsString()
  @Length(2, 100)
  q!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 15, default: 8 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(15)
  limit: number = 8;
}
