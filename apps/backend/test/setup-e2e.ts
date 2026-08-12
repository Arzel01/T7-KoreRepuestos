import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

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

/**
 * Inserta los usuarios de prueba estándar en la base de datos de test.
 * Usa ON CONFLICT DO NOTHING para ser idempotente — puede llamarse
 * al inicio de cualquier suite sin importar el orden de ejecución.
 *
 * Credenciales sembradas:
 *   test@kore.dev   / Test1234!   (rol: Cliente)
 *   admin@kore.dev  / Admin1234!  (rol: Administrador)
 */
export async function seedTestUsers(app: INestApplication): Promise<void> {
  const ds = app.get<DataSource>(getDataSourceToken());
  const [clientHash, adminHash] = await Promise.all([
    bcrypt.hash('Test1234!', 10),
    bcrypt.hash('Admin1234!', 10),
  ]);

  await ds.query(
    `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active) VALUES
       ('test@kore.dev',  $1, 'Test User',  'Cliente',       TRUE),
       ('admin@kore.dev', $2, 'Admin User', 'Administrador', TRUE)
     ON CONFLICT (email) DO NOTHING`,
    [clientHash, adminHash],
  );
}
