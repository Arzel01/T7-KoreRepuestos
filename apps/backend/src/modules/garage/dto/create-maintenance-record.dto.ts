import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import type { CreateMaintenanceRecordPayload } from '@kore/shared';

/**
 * Alta de un registro de mantenimiento (US#4 · "marcar como completado").
 * A diferencia de `CreateMaintenanceLogDto` (POST /vehicles/:id/logs), aquí el
 * vehículo viaja en el cuerpo, alineado con el API `/maintenance/records`.
 */
export class CreateMaintenanceRecordDto implements CreateMaintenanceRecordPayload {
  @ApiProperty()
  @IsInt()
  @Min(1)
  vehicleId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  planId?: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  completedMileage!: number;

  @ApiPropertyOptional({ description: 'Fecha del servicio (YYYY-MM-DD). Por defecto hoy.' })
  @IsOptional()
  @IsISO8601()
  completedAt?: string;

  @ApiPropertyOptional({ description: 'Observaciones / notas del servicio.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
