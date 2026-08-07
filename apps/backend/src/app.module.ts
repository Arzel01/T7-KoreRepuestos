import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { typeOrmConfigFactory } from './config/typeorm.config';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { GarageModule } from './modules/garage/garage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProductsModule } from './modules/products/products.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { SearchModule } from './modules/search/search.module';
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
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    NotificationsModule,
    GarageModule,
    AnalyticsModule,
    RecommendationsModule,
    SearchModule,
    CartModule,
    QuotationsModule,
  ],
})
export class AppModule {}
