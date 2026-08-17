import * as crypto from 'node:crypto';

import { UserRole } from '@kore/shared';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ReminderSchedulerService } from '../garage/reminder-scheduler.service';
import { UsersService } from '../users/users.service';

import { SessionsRepository } from './sessions.repository';

import type { AuthResponse, AuthTokens, JwtPayload } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;
  private readonly refreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsRepository: SessionsRepository,
    private readonly jwtService: JwtService,
    private readonly reminderScheduler: ReminderSchedulerService,
    config: ConfigService,
  ) {
    this.accessTtlSeconds = this.parseTtl(config.get('JWT_EXPIRES_IN', '1h'));
    this.refreshTtlSeconds = this.parseTtl(config.get('JWT_REFRESH_EXPIRES_IN', '7d'));
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async register(
    dto: RegisterDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    // El registro público SIEMPRE crea un Cliente. `dto.role` se ignora a
    // propósito: es un campo válido de CreateUserDto (lo usan otros flujos
    // internos), pero permitir que el propio solicitante se autoasigne un rol
    // por este endpoint público es una escalada de privilegios.
    const user = await this.usersService.create({ ...dto, role: UserRole.CLIENTE });
    this.logger.log(`Usuario registrado: ${user.email} (${user.id})`);
    const tokens = await this.issueTokens(
      { sub: String(user.id), email: user.email, role: user.role },
      meta,
    );
    return { user: this.usersService.toResponse(user), tokens };
  }

  async login(
    dto: LoginDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponse> {
    const invalidCreds = new UnauthorizedException('Credenciales inválidas');

    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw invalidCreds;
    }

    const ok = await this.usersService.verifyPassword(dto.password, user.passwordHash);
    if (!ok) {
      throw invalidCreds;
    }

    const tokens = await this.issueTokens(
      { sub: String(user.id), email: user.email, role: user.role },
      meta,
    );

    // US#2 — al iniciar sesión se revisan los recordatorios de sus vehículos,
    // así ve avisos de mantenimiento sin esperar al barrido diario. Nunca
    // debe hacer fallar el login.
    try {
      await this.reminderScheduler.checkUser(user.id);
    } catch (err) {
      this.logger.warn(`No se pudo chequear recordatorios en login (userId=${user.id}): ${err}`);
    }

    return { user: this.usersService.toResponse(user), tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = this.hashToken(refreshToken);
    const session = await this.sessionsRepository.findActiveByRefreshHash(hash);
    if (session) {
      await this.sessionsRepository.revoke(session.id);
    }
  }

  /**
   * Canjea un refresh token vigente por un par de tokens nuevo.
   *
   * Valida la firma/expiración del JWT (secreto de refresh, no el de acceso) y
   * que la sesión siga activa (no revocada, no expirada) contra el hash
   * guardado en `sesiones`. Rota el refresh token: revoca la sesión usada al
   * canjearla, así uno robado deja de servir en cuanto el dueño lo reutiliza.
   */
  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    const invalid = new UnauthorizedException('Refresh token inválido, expirado o revocado');
    if (!refreshToken) throw invalid;

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw invalid;
    }

    const session = await this.sessionsRepository.findActiveByRefreshHash(
      this.hashToken(refreshToken),
    );
    if (!session) throw invalid;

    await this.sessionsRepository.revoke(session.id);

    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !user.isActive) throw invalid;

    return this.issueTokens({ sub: String(user.id), email: user.email, role: user.role }, meta);
  }

  private async issueTokens(
    payload: JwtPayload,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: crypto.randomUUID() },
      { secret: this.refreshSecret, expiresIn: this.refreshTtlSeconds },
    );

    await this.sessionsRepository.createSession({
      userId: Number(payload.sub),
      refreshTokenHash: this.hashToken(refreshToken),
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
      expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSeconds,
      tokenType: 'Bearer',
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseTtl(value: string): number {
    const m = /^(\d+)\s*([smhd]?)$/.exec(value.trim());
    if (!m) return Number(value) || 3600;
    const n = Number(m[1]);
    switch (m[2]) {
      case 's':
        return n;
      case 'm':
        return n * 60;
      case 'h':
        return n * 3600;
      case 'd':
        return n * 86_400;
      default:
        return n;
    }
  }
}
