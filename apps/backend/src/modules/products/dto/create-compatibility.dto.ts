import { IsInt, Min } from 'class-validator';

export class CreateCompatibilityDto {
  @IsInt()
  @Min(1)
  modeloId!: number;
}
