import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

import { CreateTaskPartDto } from './create-task-part.dto';

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

  @ApiPropertyOptional({
    type: () => [CreateTaskPartDto],
    description: 'Productos (repuestos) requeridos para esta tarea.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskPartDto)
  parts?: CreateTaskPartDto[];
}
