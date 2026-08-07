import { MileageSource } from '@kore/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateMileageDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  currentMileage!: number;

  @ApiProperty({ enum: MileageSource, required: false, default: MileageSource.USUARIO })
  @IsOptional()
  @IsEnum(MileageSource)
  source?: MileageSource;
}
