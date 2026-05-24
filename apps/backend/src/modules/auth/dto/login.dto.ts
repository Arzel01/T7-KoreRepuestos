import { IsEmail, IsString, Length } from 'class-validator';

/**
 * Payload del endpoint `POST /api/auth/login`.
 *
 * No reutilizamos `CreateUserDto` porque login no debe validar fuerza
 * de contraseña — eso solo aplica al registro. Aquí únicamente verificamos
 * tipos y longitudes razonables para evitar payloads abusivos.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email con formato inválido' })
  email!: string;

  @IsString()
  @Length(1, 72, { message: 'La contraseña no puede estar vacía' })
  password!: string;
}
