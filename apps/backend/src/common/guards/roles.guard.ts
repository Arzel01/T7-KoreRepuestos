import { UserRole } from '@kore/shared';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

import type { JwtPayload } from '../../modules/auth/dto/auth-response.dto';

/**
 * Guard de autorización por rol.
 *
 * Asume que `JwtAuthGuard` ya autenticó la petición y dejó el payload
 * en `req.user`. Aquí verificamos que el rol del usuario coincida con
 * AL MENOS uno de los roles declarados por `@Roles(...)`.
 *
 * Comportamiento:
 *   · Handler sin `@Roles()` → permite paso (solo autenticación basta).
 *   · Handler con `@Roles(ADMIN)` y usuario CLIENTE → 403 Forbidden.
 *
 * Nota DI: `Reflector` se inyecta como VALOR (no `type`).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const hasRole = requiredRoles.some((r) => r === user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Acceso denegado: se requiere rol ${requiredRoles.join(' o ')}`);
    }
    return true;
  }
}
