import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del módulo de autenticación (US-Auth).
 *
 * Cubre los criterios de aceptación de la historia:
 *   ✓ Registro exitoso → 201 + tokens
 *   ✓ Registro con email duplicado → 409
 *   ✓ Registro con payload inválido (password débil, email malformado) → 400
 *   ✓ Login exitoso → 200 + tokens
 *   ✓ Login con credenciales inválidas → 401 (sin filtrar si el email existe)
 *   ✓ Acceso a ruta protegida sin token → 401
 *   ✓ Acceso a ruta protegida con token válido → 200
 *
 * Estrategia: levanta la app real contra la BD `kore_test` (configurada en
 * CI con `DB_SYNCHRONIZE=true`) y limpia entre tests usando truncate.
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Aislamiento por test: borra usuarios y sesiones residuales.
    await dataSource.query('TRUNCATE TABLE sesiones, usuarios RESTART IDENTITY CASCADE');
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/register
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/register', () => {
    const validPayload = {
      email: 'nuevo@kore.test',
      password: 'StrongPass1',
      firstName: 'Nuevo',
      lastName: 'Usuario',
    };

    it('registra un usuario y devuelve tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validPayload)
        .expect(201);

      expect(res.body).toMatchObject({
        user: {
          email: validPayload.email,
          firstName: validPayload.firstName,
          role: 'Cliente',
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          tokenType: 'Bearer',
          expiresIn: expect.any(Number),
        },
      });
      // Nunca debe filtrar el hash:
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('rechaza email duplicado con 409', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validPayload)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validPayload)
        .expect(409);
    });

    it('rechaza email con formato inválido (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...validPayload, email: 'no-es-email' })
        .expect(400);
    });

    it('rechaza contraseña débil (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...validPayload, password: 'short' })
        .expect(400);
    });

    it('rechaza campos extra no declarados (anti-pollution)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...validPayload, isAdmin: true })
        .expect(400);
    });

    it('ignora un `role` inyectado en el payload: siempre crea un Cliente (anti-privesc)', async () => {
      // `role` SÍ es un campo declarado de CreateUserDto (lo usan otros
      // flujos internos), así que `forbidNonWhitelisted` no lo bloquea. El
      // registro público debe forzar Cliente igual, sin confiar en el valor
      // que mande quien se registra.
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...validPayload, role: 'Administrador' })
        .expect(201);

      expect(res.body.user.role).toBe('Cliente');

      // Prueba end-to-end: con ese token no debe poder pasar un guard @Roles(ADMINISTRADOR).
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${res.body.tokens.accessToken}`)
        .send({ sku: 'PRIVESC-TEST', name: 'X', price: 1, stock: 1 })
        .expect(403);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/refresh
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/refresh', () => {
    const creds = {
      email: 'refresh@kore.test',
      password: 'RefreshPass1',
      firstName: 'Refresh',
      lastName: 'Tester',
    };

    it('canjea un refresh token vigente por un par de tokens nuevo', async () => {
      const reg = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(creds)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: reg.body.tokens.refreshToken })
        .expect(200);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'Bearer',
      });
      // El nuevo access token debe servir para acceder a una ruta protegida.
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${res.body.accessToken}`)
        .expect(200);
    });

    it('rota el refresh token: el usado no vuelve a servir (401 al reintentarlo)', async () => {
      const reg = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...creds, email: 'refresh-rotate@kore.test' })
        .expect(201);
      const firstRefresh = reg.body.tokens.refreshToken as string;

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: firstRefresh })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: firstRefresh })
        .expect(401);
    });

    it('rechaza un refresh token inventado o vacío (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'no-es-un-jwt' })
        .expect(401);

      await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({}).expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/login
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/auth/login', () => {
    const creds = {
      email: 'login@kore.test',
      password: 'LoginPass1',
      firstName: 'Login',
      lastName: 'Tester',
    };

    beforeEach(async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(creds).expect(201);
    });

    it('autentica con credenciales correctas (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: creds.email, password: creds.password })
        .expect(200);

      expect(res.body.tokens.accessToken).toEqual(expect.any(String));
      expect(res.body.user.email).toBe(creds.email);
    });

    it('rechaza contraseña incorrecta con 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: creds.email, password: 'WrongPass1' })
        .expect(401);
    });

    it('rechaza email inexistente con 401 (mismo mensaje, anti-enumeración)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'noexiste@kore.test', password: 'Whatever1' })
        .expect(401);
      expect(res.body.message).toBe('Credenciales inválidas');
    });
  });

  // ---------------------------------------------------------------------------
  // Protección de rutas privadas — GET /api/v1/auth/me
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/auth/me (ruta protegida)', () => {
    it('rechaza acceso sin Authorization header (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('rechaza un Bearer inventado (401)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-real-jwt')
        .expect(401);
    });

    it('permite acceso con un JWT recién emitido (200)', async () => {
      const reg = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'me@kore.test',
          password: 'MePass1234',
          firstName: 'Yo',
          lastName: 'Mismo',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${reg.body.tokens.accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        sub: expect.any(String),
        email: 'me@kore.test',
        role: 'Cliente',
      });
    });
  });
});
