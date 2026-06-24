import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMaintenanceGuideDto {
  @ApiProperty({ description: 'ID del modelo al que pertenece la guía.' })
  @IsInt()
  modelId!: number;

  @ApiProperty({ description: 'Descripción corta de la guía.', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
