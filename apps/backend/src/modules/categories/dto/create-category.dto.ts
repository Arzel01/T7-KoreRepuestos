import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}
