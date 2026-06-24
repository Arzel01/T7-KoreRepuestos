import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateMaintenanceTaskDto {
  @ApiProperty({ description: 'Descripción de la tarea.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Intervalo de kilometraje en kilómetros.' })
  @IsInt()
  @Min(0)
  mileageInterval!: number;

  @ApiProperty({ description: 'Intervalo en meses.', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthInterval?: number;

  @ApiProperty({ description: 'Indica si la tarea es crítica.', required: false })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;
}
