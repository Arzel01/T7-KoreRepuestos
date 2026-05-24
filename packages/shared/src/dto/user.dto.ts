import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

import { UserRole } from '../enums/user-role.enum';

/**
 * DTOs compartidos para la entidad Usuario.
 * Se usan tanto en el backend (validación de input) como en los frontends
 * (tipado de payloads de petición/respuesta).
 */

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 72)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula y un número',
  })
  password!: string;

  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
