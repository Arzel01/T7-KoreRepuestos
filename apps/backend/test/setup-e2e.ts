import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module';

import type { INestApplication } from '@nestjs/common';

/**
 * Helper común a todos los tests e2e.
 *
 * Crea una instancia de la aplicación NestJS con la misma configuración
 * global que `main.ts` (ValidationPipe en modo estricto). De esta forma
 * los tests cubren el comportamiento real, no una variante "permisiva".
 */
export async function createTestingApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return app;
}
