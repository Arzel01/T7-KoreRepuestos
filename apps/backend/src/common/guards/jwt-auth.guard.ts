import { Injectable, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global de autenticación basado en JWT (estrategia Passport `jwt`).
 *
 * Comportamiento:
 *   1. Si el handler/controlador lleva `@Public()` → pasa sin validar.
 *   2. Si no, extrae `Authorization: Bearer <token>`, verifica la firma
 *      con `JWT_SECRET` y popula `req.user` con el payload.
 *   3. Cualquier fallo (token ausente, expirado, firma inválida) → 401.
 *
 * Se registra como guard global en `auth.module.ts` mediante `APP_GUARD`,
 * de modo que TODAS las rutas requieren auth salvo las marcadas como públicas.
 *
 * `Reflector` se inyecta como VALOR (token de DI en runtime).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(err: unknown, user: TUser, _info: unknown): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Token de autenticación inválido o ausente');
    }
    return user;
  }
}
