import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Length, Max, Min } from 'class-validator';

// Un vehículo no puede ser más viejo que el primer año de fabricación
// razonable ni "del año que viene" más allá del ciclo de lanzamientos.
const MIN_VEHICLE_YEAR = 1980;
const MAX_VEHICLE_YEAR = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  brandId!: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  modelId!: number;

  @ApiProperty({ minimum: MIN_VEHICLE_YEAR, maximum: MAX_VEHICLE_YEAR })
  @IsInt()
  @Min(MIN_VEHICLE_YEAR)
  @Max(MAX_VEHICLE_YEAR)
  year!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 20)
  plate?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  currentMileage!: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  averageDailyMileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  alias?: string;
}
