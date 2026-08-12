import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export class CreateMaintenanceLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  planId?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  completedMileage!: number;

  @ApiPropertyOptional({ description: 'Fecha del servicio (YYYY-MM-DD). Por defecto hoy.' })
  @IsOptional()
  @IsISO8601()
  completedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
