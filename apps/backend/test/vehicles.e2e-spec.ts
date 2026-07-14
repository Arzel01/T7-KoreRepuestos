import * as request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';

/**
 * Tests e2e para el módulo de vehículos (US#1).
 *
 * Prerequisito: la base de datos de test debe tener al menos una marca y un
 * modelo, y un usuario con credenciales conocidas. Si el entorno de test usa
 * transacciones con rollback, adaptar el setup.
 */
describe('Vehicles (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let vehicleId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── helpers ──────────────────────────────────────────────────────────────

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    return (res.body as { accessToken: string }).accessToken;
  }

  // ── rutas públicas ────────────────────────────────────────────────────────

  it('GET /vehicles/brands → 200 array', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/vehicles/brands').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /vehicles/brands/:brandId/models → 200 array', async () => {
    const brands = await request(app.getHttpServer())
      .get('/api/v1/vehicles/brands')
      .expect(200)
      .then((r) => r.body as { id: number }[]);

    if (brands.length === 0) return; // skip si no hay marcas

    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/brands/${brands[0].id}/models`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── autenticación requerida ───────────────────────────────────────────────

  it('GET /vehicles sin token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/vehicles').expect(401);
  });

  // ── flujo autenticado ─────────────────────────────────────────────────────

  describe('authenticated flow', () => {
    beforeAll(async () => {
      token = await login(
        process.env.TEST_USER_EMAIL ?? 'test@kore.dev',
        process.env.TEST_USER_PASS ?? 'Test1234!',
      );
    });

    it('GET /vehicles → 200 array', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /vehicles → 201 con vehicleId', async () => {
      const brands = await request(app.getHttpServer())
        .get('/api/v1/vehicles/brands')
        .then((r) => r.body as { id: number }[]);
      if (brands.length === 0) return;

      const models = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/brands/${brands[0].id}/models`)
        .then((r) => r.body as { id: number }[]);
      if (models.length === 0) return;

      const res = await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          brandId: brands[0].id,
          modelId: models[0].id,
          year: 2020,
          currentMileage: 10000,
          alias: 'Test Vehicle',
        })
        .expect(201);

      vehicleId = (res.body as { id: number }).id;
      expect(vehicleId).toBeGreaterThan(0);
    });

    it('PUT /vehicles/:id → 200 happy path', async () => {
      if (!vehicleId) return;
      const res = await request(app.getHttpServer())
        .put(`/api/v1/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ alias: 'Updated Alias', currentMileage: 11000 })
        .expect(200);
      expect((res.body as { alias: string }).alias).toBe('Updated Alias');
    });

    it('PUT /vehicles/:id con kilometraje menor → 400', async () => {
      if (!vehicleId) return;
      await request(app.getHttpServer())
        .put(`/api/v1/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ currentMileage: 1000 })
        .expect(400);
    });

    it('PUT /vehicles/:id de vehículo ajeno → 404', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/vehicles/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ alias: 'Hacked' })
        .expect(404);
    });

    it('POST /vehicles con modelId de otra marca → 400', async () => {
      const brands = await request(app.getHttpServer())
        .get('/api/v1/vehicles/brands')
        .then((r) => r.body as { id: number }[]);
      if (brands.length < 2) return;

      const modelsB1 = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/brands/${brands[0].id}/models`)
        .then((r) => r.body as { id: number }[]);
      if (modelsB1.length === 0) return;

      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          brandId: brands[1].id,
          modelId: modelsB1[0].id,
          year: 2020,
          currentMileage: 0,
        })
        .expect(400);
    });

    it('DELETE /vehicles/:id → 204', async () => {
      if (!vehicleId) return;
      await request(app.getHttpServer())
        .delete(`/api/v1/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });
  });
});
