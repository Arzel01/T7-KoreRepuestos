import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { typeOrmConfigFactory } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { GarageModule } from './modules/garage/garage.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';

/**
 * Módulo raíz de la aplicación.
 *
 * Orden de imports significativo:
 *   1. ConfigModule global → variables de entorno disponibles vía DI.
 *   2. TypeOrmModule async → conexión a Postgres usando ConfigService.
 *   3. AuthModule          → registra JwtAuthGuard como guard GLOBAL.
 *   4. Módulos de dominio  → todos quedan protegidos por defecto.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    GarageModule,
  ],
})
export class AppModule {}
