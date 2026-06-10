import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import type { AuthResponse, JwtPayload } from './dto/auth-response.dto';
import type { Request } from 'express';

/**
 * Controlador HTTP del flujo de autenticación.
 *
 * Endpoints expuestos bajo el prefijo global `/api/v1` (ver `main.ts`):
 *   · POST /api/v1/auth/register  (público)
 *   · POST /api/v1/auth/login     (público)
 *   · POST /api/v1/auth/logout    (autenticado)
 *   · GET  /api/v1/auth/me        (autenticado)
 *
 * Las dos primeras llevan `@Public()` para saltar el `JwtAuthGuard` global.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra un nuevo usuario y devuelve tokens' })
  register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthResponse> {
    return this.authService.register(dto, this.extractMeta(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica un usuario existente' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponse> {
    return this.authService.login(dto, this.extractMeta(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoca la sesión activa (refresh token)' })
  async logout(@Body() body: { refreshToken: string }): Promise<void> {
    if (body?.refreshToken) {
      await this.authService.logout(body.refreshToken);
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve el payload del JWT del usuario actual' })
  me(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }

  /** Extrae IP + UA para auditoría de sesiones. */
  private extractMeta(req: Request): { userAgent?: string; ipAddress?: string } {
    return {
      userAgent: req.headers['user-agent']?.toString(),
      ipAddress: (req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.ip) as
        | string
        | undefined,
    };
  }
}
