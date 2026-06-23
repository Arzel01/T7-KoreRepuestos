import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  brandId!: number;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  modelId!: number;

  @ApiProperty()
  @IsInt()
  @Min(1900)
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
