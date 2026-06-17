import type { UserResponse } from '@kore/shared';

/**
 * Respuesta estándar de los endpoints `/auth/login` y `/auth/register`.
 * El JWT viaja en el body para que el cliente decida cómo persistirlo
 * (memoria, sessionStorage, httpOnly cookie vía un BFF, etc.).
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Segundos hasta la expiración del accessToken (informativo para el cliente). */
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

/**
 * Forma del payload JWT codificado en `accessToken`. Coincide con lo que
 * `JwtStrategy.validate()` recibe tras la verificación.
 */
export interface JwtPayload {
  /** Subject = user.id (UUID). */
  sub: string;
  email: string;
  role: string;
  /** Issued-at y expiración los añade automáticamente la librería @nestjs/jwt. */
  iat?: number;
  exp?: number;
}
