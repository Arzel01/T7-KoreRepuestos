import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '@kore/shared';

/**
 * Lista de roles requeridos para acceder al handler decorado.
 * Es leída por `RolesGuard` para autorizar la petición DESPUÉS de que
 * `JwtAuthGuard` haya autenticado al usuario.
 *
 * Uso:
 *   @Roles(UserRole.ADMIN)
 *   @Post('products')
 *   create(@Body() dto: CreateProductDto) { ... }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
