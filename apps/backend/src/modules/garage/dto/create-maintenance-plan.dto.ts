import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

/**
 * Una tarea individual dentro de una guía de mantenimiento.
 * Se envía inline en `CreateMaintenanceGuideDto.plans[]`.
 */
export class CreateMaintenancePlanDto {
  @ApiProperty({ example: 'Cambio de aceite y filtro', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  description!: string;

  @ApiProperty({ example: 5000, description: 'Intervalo en km para repetir la tarea.' })
  @IsInt()
  @IsPositive()
  mileageInterval!: number;

  @ApiPropertyOptional({
    example: 6,
    description: 'Intervalo alternativo en meses (lo que ocurra primero).',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  monthInterval?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Tarea crítica: bloquea circulación si se omite.',
  })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;
}
