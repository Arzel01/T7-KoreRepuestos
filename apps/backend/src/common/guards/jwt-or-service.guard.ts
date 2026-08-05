import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from './jwt-auth.guard';

import type { Request } from 'express';

@Injectable()
export class JwtOrServiceGuard implements CanActivate {
  constructor(
    private readonly jwtAuthGuard: JwtAuthGuard,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const configuredApiKey = this.configService.get<string>('MILEAGE_SERVICE_API_KEY');

    if (configuredApiKey) {
      const keyFromHeader = req.headers['x-service-api-key'];
      const candidate = Array.isArray(keyFromHeader) ? keyFromHeader[0] : keyFromHeader;
      if (candidate && candidate === configuredApiKey) {
        return true;
      }
    }

    const ok = await Promise.resolve(this.jwtAuthGuard.canActivate(context));
    if (ok) return true;

    throw new UnauthorizedException('Se requiere JWT o x-service-api-key válido');
  }
}
