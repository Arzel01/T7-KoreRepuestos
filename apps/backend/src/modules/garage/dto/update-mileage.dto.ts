import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateMileageDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  currentMileage!: number;
}
