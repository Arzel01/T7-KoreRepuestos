import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import type { NotificationChannel } from '@kore/shared';

export class CreateNotificationDto {
  @ApiPropertyOptional({
    description: 'Tipo de notificación.',
    default: 'recordatorio_mantenimiento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo?: string;

  @ApiProperty({ description: 'Título visible en el centro de notificaciones.' })
  @IsString()
  @MaxLength(160)
  titulo!: string;

  @ApiProperty({ description: 'Mensaje de la notificación.' })
  @IsString()
  @MaxLength(4000)
  mensaje!: string;

  @ApiPropertyOptional({ enum: ['app', 'email'], default: 'app' })
  @IsOptional()
  @IsIn(['app', 'email'])
  canal?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  vehicleId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  planId?: number;

  @ApiPropertyOptional({ description: 'Fecha/hora de programación (ISO-8601). Por defecto ahora.' })
  @IsOptional()
  @IsISO8601()
  scheduledFor?: string;
}
