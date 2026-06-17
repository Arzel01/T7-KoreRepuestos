import { createParamDecorator } from '@nestjs/common';

import type { JwtPayload } from '../../modules/auth/dto/auth-response.dto';
import type { ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator que inyecta el usuario autenticado en el handler.
 *
 * Equivalente sintáctico a `req.user`. Se rellena en `JwtStrategy.validate()`
 * tras verificar la firma del token.
 *
 * Uso:
 *   @Get('me')
 *   me(@CurrentUser() user: JwtPayload) { return user; }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return req.user;
  },
);
