import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersRepository } from '../../users/users.repository';

import type { JwtPayload } from '../dto/auth-response.dto';

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
    // sub llega como string en el JWT; convertimos a number para la consulta.
    const user = await this.usersRepository.findActiveById(Number(payload.sub));
    if (!user) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }
    return {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    };
  }
}
