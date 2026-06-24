import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CreateMaintenancePlanDto } from './create-maintenance-plan.dto';

/**
 * Payload para crear una guía de mantenimiento.
 *
 * Una guía pertenece a un modelo de vehículo específico (`modelId`) y puede
 * incluir sus tareas de mantenimiento en la misma petición (`plans`), lo que
 * evita múltiples round-trips al crear una guía completa de una vez.
 *
 * Si se omiten `plans`, la guía se crea vacía y las tareas se pueden agregar
 * posteriormente via `POST /maintenance/guides/:id/plans` (endpoint futuro).
 */
export class CreateMaintenanceGuideDto {
  @ApiProperty({
    example: 3,
    description: 'ID del modelo de vehículo al que aplica esta guía (tabla `modelos`).',
  })
  @IsInt()
  @IsPositive()
  modelId!: number;

  @ApiPropertyOptional({
    example: 'Guía de mantenimiento preventivo para motor 1.6L aspirado.',
    description: 'Descripción general de la guía. Opcional.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: () => [CreateMaintenancePlanDto],
    description:
      'Tareas de mantenimiento a crear junto con la guía. Mínimo 1 si se incluye el array.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMaintenancePlanDto)
  plans?: CreateMaintenancePlanDto[];
}
