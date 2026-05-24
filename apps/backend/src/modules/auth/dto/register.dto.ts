import { CreateUserDto } from '@kore/shared';

/**
 * Payload del endpoint `POST /api/auth/register`.
 *
 * Reutiliza el DTO compartido `CreateUserDto` (validación: email válido,
 * contraseña >= 8 chars con mayúscula + número, nombres no vacíos, etc.).
 *
 * Se declara como subclase vacía para:
 *   1. Permitir documentación específica en Swagger.
 *   2. Posibilitar futuras divergencias (p. ej. captcha, terms accepted).
 */
export class RegisterDto extends CreateUserDto {}
