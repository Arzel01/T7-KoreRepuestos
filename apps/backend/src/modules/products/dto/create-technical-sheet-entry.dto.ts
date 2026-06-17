import { IsString, Length } from 'class-validator';

export class CreateTechnicalSheetEntryDto {
  @IsString()
  @Length(1, 200)
  attribute!: string;

  @IsString()
  @Length(1, 500)
  value!: string;
}
