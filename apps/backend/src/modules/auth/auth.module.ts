import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Session } from './entities/session.entity';
import { SessionsRepository } from './sessions.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Módulo de autenticación.
 *
 * Configuración clave:
 *   · `JwtModule.registerAsync` lee `JWT_SECRET` y `JWT_EXPIRES_IN` de env.
 *   · `APP_GUARD` JwtAuthGuard se aplica de forma GLOBAL → todas las rutas
 *     requieren JWT salvo las marcadas con `@Public()`.
 *   · `APP_GUARD` RolesGuard corre después y aplica `@Roles(...)` cuando exista.
 */
@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    SessionsRepository,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
