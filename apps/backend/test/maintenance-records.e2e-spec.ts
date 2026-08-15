import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp, seedTestUsers } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * TC-A-016: Marcar tarea de mantenimiento como completada.
 *
 * Cubre POST /api/v1/maintenance/records (MaintenanceRecordsService.create()):
 *   ✓ 201 con MaintenanceRecordResponse (id, vehicleId, completedAt, completedMileage)
 *   ✓ Persiste en historial_mantenimiento con fecha y kilometraje correctos
 *   ✓ GET /maintenance/records?vehicleId → historial incluye el nuevo registro
 *   ✓ Con planId → planDescription presente en la respuesta
 *   ✓ 404 si el vehículo no pertenece al usuario
 *   ✓ 404 si el vehicleId no existe
 *   ✓ 401 sin token
 */
describe('MaintenanceRecordsController (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  let vehicleId: number;
  let planId: number;
  let brandId: number;
  let modelId: number;

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { tokens: { accessToken: string } }).tokens.accessToken;
  }

  function authReq(method: 'get' | 'post', url: string) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
  }

  beforeAll(async () => {
    app = await createTestingApp();
    await seedTestUsers(app);
    ds = app.get<DataSource>(getDataSourceToken());

    await ds.query(
      `INSERT INTO marcas (nombre) VALUES ('E2E Rec Marca') ON CONFLICT (nombre) DO NOTHING`,
    );
    [{ id_marca: brandId }] = await ds.query(
      `SELECT id_marca FROM marcas WHERE nombre = 'E2E Rec Marca'`,
    );

    await ds.query(
      `INSERT INTO modelos (id_marca, nombre) VALUES ($1, 'E2E Rec Modelo')
       ON CONFLICT (id_marca, nombre) DO NOTHING`,
      [brandId],
    );
    [{ id_modelo: modelId }] = await ds.query(
      `SELECT id_modelo FROM modelos WHERE id_marca = $1 AND nombre = 'E2E Rec Modelo'`,
      [brandId],
    );

    token = await login('test@kore.dev', 'Test1234!');

    const vehicleRes = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId, modelId, year: 2021, currentMileage: 10000 })
      .expect(201);
    vehicleId = vehicleRes.body.id as number;

    // Crear guía y plan para el modelo
    await ds.query(
      `INSERT INTO guias_mantenimiento (id_modelo, descripcion)
       SELECT $1, 'E2E Rec Guia'
       WHERE NOT EXISTS (
         SELECT 1 FROM guias_mantenimiento WHERE id_modelo = $1 AND descripcion = 'E2E Rec Guia'
       )`,
      [modelId],
    );
    const [{ id_guia }] = await ds.query(
      `SELECT id_guia FROM guias_mantenimiento
       WHERE id_modelo = $1 AND descripcion = 'E2E Rec Guia' LIMIT 1`,
      [modelId],
    );

    await ds.query(
      `INSERT INTO tareas_mantenimiento (id_guia, descripcion_tarea, intervalo_kilometraje, es_critica)
       SELECT $1, 'Cambio aceite E2E Rec', 5000, FALSE
       WHERE NOT EXISTS (
         SELECT 1 FROM tareas_mantenimiento
         WHERE id_guia = $1 AND descripcion_tarea = 'Cambio aceite E2E Rec'
       )`,
      [id_guia],
    );
    const [{ id_tarea }] = await ds.query(
      `SELECT id_tarea FROM tareas_mantenimiento
       WHERE id_guia = $1 AND descripcion_tarea = 'Cambio aceite E2E Rec' LIMIT 1`,
      [id_guia],
    );
    planId = id_tarea as number;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /maintenance/records sin token → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/maintenance/records')
      .send({ vehicleId, completedMileage: 15000 })
      .expect(401);
  });

  it('POST → 201 con MaintenanceRecordResponse (TC-A-016)', async () => {
    const res = await authReq('post', '/api/v1/maintenance/records')
      .send({ vehicleId, completedMileage: 15000, notes: 'Cambio con aceite sintético' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      vehicleId,
      completedMileage: 15000,
      completedAt: expect.any(String),
    });
    expect(res.body.notes).toBe('Cambio con aceite sintético');
  });

  it('registro persiste en historial_mantenimiento (TC-A-016)', async () => {
    const res = await authReq('post', '/api/v1/maintenance/records')
      .send({ vehicleId, completedMileage: 16000 })
      .expect(201);

    const rows: Array<{ kilometraje_servicio: number; id_vehiculo_usuario: number }> =
      await ds.query(
        `SELECT kilometraje_servicio, id_vehiculo_usuario
         FROM historial_mantenimiento WHERE id_historial = $1`,
        [res.body.id],
      );
    expect(rows).toHaveLength(1);
    expect(rows[0].kilometraje_servicio).toBe(16000);
    expect(rows[0].id_vehiculo_usuario).toBe(vehicleId);
  });

  it('GET /maintenance/records?vehicleId — historial incluye el registro creado (TC-A-016)', async () => {
    const createRes = await authReq('post', '/api/v1/maintenance/records')
      .send({ vehicleId, completedMileage: 17000, notes: 'E2E history check' })
      .expect(201);

    const histRes = await authReq(
      'get',
      `/api/v1/maintenance/records?vehicleId=${vehicleId}`,
    ).expect(200);

    expect(Array.isArray(histRes.body)).toBe(true);
    const found = (histRes.body as Array<{ id: number }>).find((r) => r.id === createRes.body.id);
    expect(found).toBeDefined();
  });

  it('POST con planId → planDescription presente en el historial (TC-A-016)', async () => {
    const res = await authReq('post', '/api/v1/maintenance/records')
      .send({ vehicleId, planId, completedMileage: 15000 })
      .expect(201);

    expect(res.body.planId).toBe(planId);

    // planDescription viene cargada con la relación, disponible en el GET del historial
    const histRes = await authReq(
      'get',
      `/api/v1/maintenance/records?vehicleId=${vehicleId}`,
    ).expect(200);
    const record = (histRes.body as Array<{ id: number; planDescription?: string }>).find(
      (r) => r.id === res.body.id,
    );
    expect(record).toBeDefined();
    expect(typeof record!.planDescription).toBe('string');
    expect(record!.planDescription).toBeTruthy();
  });

  it('POST con vehículo de otro usuario → 404 (TC-A-016)', async () => {
    const otherReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'other-rec@test.local',
        password: 'OtherRec1A',
        firstName: 'Other',
        lastName: 'User',
      })
      .expect(201);
    const otherToken = otherReg.body.tokens.accessToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/maintenance/records')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ vehicleId, completedMileage: 15000 })
      .expect(404);
  });

  it('POST con vehicleId inexistente → 404', async () => {
    await authReq('post', '/api/v1/maintenance/records')
      .send({ vehicleId: 999999, completedMileage: 1000 })
      .expect(404);
  });
});
