import { SetMetadata } from '@nestjs/common';

/**
 * Marca un handler como público (sin requerir JWT).
 *
 * Se usa en combinación con `JwtAuthGuard` aplicado globalmente:
 *   - Por defecto TODAS las rutas requieren autenticación.
 *   - Las que llevan `@Public()` (login, register, health, swagger) se omiten.
 *
 * Razón: "secure by default" — es más seguro olvidarse de marcar algo
 * como público que olvidarse de proteger algo privado.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
