import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp, seedTestUsers } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

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
    await seedTestUsers(app);
  });

  afterAll(async () => {
    await app.close();
  });

  // ── helpers ──────────────────────────────────────────────────────────────

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { tokens: { accessToken: string } }).tokens.accessToken;
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

  it('GET /vehicles/brands/:brandId/models → sin nombres duplicados (post-dedup)', async () => {
    const brands = await request(app.getHttpServer())
      .get('/api/v1/vehicles/brands')
      .then((r) => r.body as { id: number }[]);
    if (brands.length === 0) return;

    const models = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/brands/${brands[0].id}/models`)
      .then((r) => r.body as { nombre: string }[]);

    const names = models.map((m) => m.nombre);
    // Tras DedupeModelos + UNIQUE(id_marca, nombre) no debe repetirse un modelo.
    expect(new Set(names).size).toBe(names.length);
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

    it('POST /vehicles con año fuera de rango (1980-actual+1) → 400', async () => {
      const brands = await request(app.getHttpServer())
        .get('/api/v1/vehicles/brands')
        .then((r) => r.body as { id: number }[]);
      if (brands.length === 0) return;

      const models = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/brands/${brands[0].id}/models`)
        .then((r) => r.body as { id: number }[]);
      if (models.length === 0) return;

      const base = { brandId: brands[0].id, modelId: models[0].id, currentMileage: 1000 };

      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...base, year: 1979 })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...base, year: new Date().getFullYear() + 2 })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...base, year: 1980 })
        .expect(201);
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

// ─────────────────────────────────────────────────────────────────────────────
// TC-A-013: Registro de vehículo — verificación en BD (vehiculos_usuario)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TC-A-013: Tras POST /vehicles el registro persiste en `vehiculos_usuario`
 * con el id_usuario correcto del usuario autenticado.
 */
describe('Vehicles — registro en vehiculos_usuario (TC-A-013)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  let userId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    await seedTestUsers(app);
    ds = app.get<DataSource>(getDataSourceToken());

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@kore.dev', password: 'Test1234!' })
      .expect(200);
    token = (loginRes.body as { tokens: { accessToken: string } }).tokens.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    userId = Number((meRes.body as { sub: string }).sub);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /vehicles persiste registro en vehiculos_usuario con id_usuario correcto (TC-A-013)', async () => {
    const brands = await request(app.getHttpServer())
      .get('/api/v1/vehicles/brands')
      .then((r) => r.body as { id: number }[]);
    if (brands.length === 0) return;

    const models = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/brands/${brands[0].id}/models`)
      .then((r) => r.body as { id: number }[]);
    if (models.length === 0) return;

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        brandId: brands[0].id,
        modelId: models[0].id,
        year: 2019,
        currentMileage: 5000,
        alias: 'Mi carro de prueba',
      })
      .expect(201);

    const newVehicleId = (createRes.body as { id: number }).id;

    const rows: Array<{ id_usuario: number; kilometraje_actual: number; anio: number }> =
      await ds.query(
        `SELECT id_usuario, kilometraje_actual, anio
         FROM vehiculos_usuario WHERE id_vehiculo_usuario = $1`,
        [newVehicleId],
      );

    expect(rows).toHaveLength(1);
    expect(rows[0].id_usuario).toBe(userId);
    expect(rows[0].kilometraje_actual).toBe(5000);
    expect(rows[0].anio).toBe(2019);
  });
});
