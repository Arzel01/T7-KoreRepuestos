import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del módulo de guías de mantenimiento.
 *
 * Cubre:
 *   ✓ POST /api/v1/maintenance/guides — crear guía con tareas
 *   ✓ POST sin token → 401
 *   ✓ POST con cliente → 403
 *   ✓ POST con modelo inexistente → 404
 *   ✓ POST duplicado (mismo modelo) → 400
 *   ✓ GET /api/v1/maintenance/guides — listar (público)
 *   ✓ GET /api/v1/maintenance/guides/:id — detalle (público)
 *   ✓ GET /:id inexistente → 404
 */
describe('MaintenanceGuidesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let clientToken: string;
  let modelId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE sesiones, guias_mantenimiento, tareas_mantenimiento,
       modelos, marcas, usuarios RESTART IDENTITY CASCADE`,
    );

    // Insertar marca y modelo de prueba
    await dataSource.query(`INSERT INTO marcas (nombre) VALUES ('Toyota')`);
    const modelRows = await dataSource.query<{ id_modelo: number }[]>(
      `INSERT INTO modelos (nombre, id_marca, anio_inicio) VALUES ('Corolla', 1, 2015)
       RETURNING id_modelo`,
    );
    modelId = modelRows[0].id_modelo;

    // Admin
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('AdminPass1', 4);
    await dataSource.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active)
       VALUES ('admin@test.local', $1, 'Admin Test', 'Administrador', TRUE)`,
      [hash],
    );
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.local', password: 'AdminPass1' })
      .expect(200);
    adminToken = adminLogin.body.tokens.accessToken;

    // Cliente
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'client@test.local',
        password: 'ClientPass1',
        firstName: 'Cliente',
        lastName: 'Test',
      })
      .expect(201);
    clientToken = reg.body.tokens.accessToken;
  });

  // ── POST /maintenance/guides ────────────────────────────────────────

  it('crea una guía con tareas (201)', async () => {
    const payload = {
      modelId,
      description: 'Plan preventivo Corolla',
      plans: [
        { description: 'Cambio de aceite', mileageInterval: 5000, isCritical: false },
        {
          description: 'Revisión de frenos',
          mileageInterval: 10000,
          monthInterval: 12,
          isCritical: true,
        },
      ],
    };

    const res = await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      modeloId: modelId,
      descripcion: payload.description,
    });
    expect(res.body.plans).toHaveLength(2);
    expect(res.body.plans[0]).toMatchObject({
      description: 'Cambio de aceite',
      mileageInterval: 5000,
      isCritical: false,
    });
  });

  it('rechaza la petición sin token (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .send({ modelId })
      .expect(401);
  });

  it('rechaza la petición de un cliente (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ modelId })
      .expect(403);
  });

  it('rechaza modelo inexistente (404)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ modelId: 9999 })
      .expect(404);
  });

  it('rechaza guía duplicada para el mismo modelo (400)', async () => {
    const payload = { modelId };
    await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(400);
  });

  // ── GET /maintenance/guides ─────────────────────────────────────────

  it('lista las guías sin autenticación (200)', async () => {
    // Crear una guía primero
    await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ modelId, description: 'Guía listable' })
      .expect(201);

    const res = await request(app.getHttpServer()).get('/api/v1/maintenance/guides').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ modeloId: modelId });
  });

  it('devuelve array vacío cuando no hay guías (200)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/maintenance/guides').expect(200);

    expect(res.body).toEqual([]);
  });

  // ── GET /maintenance/guides/:id ─────────────────────────────────────

  it('obtiene una guía por ID con sus planes (200)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        modelId,
        plans: [{ description: 'Cambio aceite', mileageInterval: 5000 }],
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/maintenance/guides/${created.body.id}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: created.body.id,
      modeloId: modelId,
    });
    expect(res.body.plans).toHaveLength(1);
    expect(res.body.modelo).toMatchObject({ nombre: 'Corolla' });
  });

  it('devuelve 404 para una guía inexistente', async () => {
    await request(app.getHttpServer()).get('/api/v1/maintenance/guides/9999').expect(404);
  });
});
