import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Length, Max, Min } from 'class-validator';

const MIN_VEHICLE_YEAR = 1980;
const MAX_VEHICLE_YEAR = new Date().getFullYear() + 1;

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  brandId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  modelId?: number;

  @ApiPropertyOptional({ minimum: MIN_VEHICLE_YEAR, maximum: MAX_VEHICLE_YEAR })
  @IsOptional()
  @IsInt()
  @Min(MIN_VEHICLE_YEAR)
  @Max(MAX_VEHICLE_YEAR)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 20)
  plate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  currentMileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  averageDailyMileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  alias?: string;
}
