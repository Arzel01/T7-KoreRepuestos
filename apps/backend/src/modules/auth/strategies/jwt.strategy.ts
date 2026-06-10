import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersRepository } from '../../users/users.repository';

import type { JwtPayload } from '../dto/auth-response.dto';

/**
 * Estrategia Passport `jwt`.
 *
 * Pipeline ejecutado por `JwtAuthGuard`:
 *   1. ExtractJwt.fromAuthHeaderAsBearerToken() saca el token del header.
 *   2. passport-jwt verifica firma + expiración con `secretOrKey`.
 *   3. Llamamos `validate(payload)` con el JSON ya decodificado.
 *   4. Cargamos el usuario real desde BD para garantizar que sigue activo.
 *   5. El valor devuelto se inyecta en `req.user` y queda accesible vía
 *      `@CurrentUser()`.
 *
 * Validar contra BD aquí (no fiarse solo del payload) permite revocar
 * accesos al instante — basta marcar `is_active = false` en la tabla users.
 *
 * Nota DI: `ConfigService` y `UsersRepository` son imports de VALOR
 * (no `type`) porque NestJS los usa como tokens en runtime.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersRepository.findActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }
    // Devolvemos el payload "fresco" — refleja el rol actual en BD,
    // no el que estaba al momento de emitir el token.
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
