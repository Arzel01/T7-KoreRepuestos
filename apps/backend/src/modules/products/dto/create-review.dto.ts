import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, description: 'Calificación de 1 a 5 estrellas.' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ required: false, maxLength: 200 })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  comment?: string;
}
