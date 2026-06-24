import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del endpoint POST /api/v1/maintenance/guides.
 *
 * Cubre los criterios de aceptación:
 *   ✓ 201 con guía creada (sin planes)
 *   ✓ 201 con guía + planes inline
 *   ✓ Planes se persisten correctamente (mileageInterval, isCritical, etc.)
 *   ✓ 400 si el modelo ya tiene una guía (unicidad por modelo)
 *   ✓ 404 si modelId no existe
 *   ✓ 400 si el body tiene errores de validación (campo requerido faltante)
 *   ✓ 400 si plans[] está vacío (ArrayMinSize(1))
 *   ✓ 401 sin token
 *   ✓ 403 para rol Asesor Comercial (solo Admin puede crear guías)
 */
describe('MaintenanceGuidesController POST /api/v1/maintenance/guides (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let asesorToken: string;
  let marcaId: number;
  let modeloId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Limpiar en orden de FK: tablas hijas primero
    await dataSource.query(`
      TRUNCATE TABLE
        productos_tarea,
        historial_mantenimiento,
        tareas_mantenimiento,
        guias_mantenimiento,
        vehiculos_usuario,
        sesiones,
        usuarios
      RESTART IDENTITY CASCADE
    `);

    // Seed: una marca y un modelo de prueba
    const [marca] = await dataSource.query<Array<{ id_marca: number }>>(
      `INSERT INTO marcas (nombre) VALUES ('TestBrand') RETURNING id_marca`,
    );
    marcaId = marca.id_marca;

    const [modelo] = await dataSource.query<Array<{ id_modelo: number }>>(
      `INSERT INTO modelos (id_marca, nombre, anio_inicio, anio_fin) VALUES ($1, 'TestModel 1.6', 2018, 2024) RETURNING id_modelo`,
      [marcaId],
    );
    modeloId = modelo.id_modelo;

    // Seed: usuarios con distintos roles
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('Password1', 4);

    await dataSource.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active) VALUES
       ('admin@test.local',  $1, 'Admin Test',  'Administrador',    TRUE),
       ('asesor@test.local', $1, 'Asesor Test', 'Asesor Comercial', TRUE)`,
      [hash],
    );

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.local', password: 'Password1' })
      .expect(200);
    adminToken = adminRes.body.tokens.accessToken;

    const asesorRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'asesor@test.local', password: 'Password1' })
      .expect(200);
    asesorToken = asesorRes.body.tokens.accessToken;
  });

  const post = (body: unknown, token?: string): request.Test => {
    const req = request(app.getHttpServer()).post('/api/v1/maintenance/guides');
    return token ? req.set('Authorization', `Bearer ${token}`).send(body) : req.send(body);
  };

  it('crea una guía sin planes (201)', async () => {
    const res = await post({ modelId: modeloId, description: 'Guía básica' }, adminToken).expect(
      201,
    );

    expect(res.body).toMatchObject({
      modeloId,
      descripcion: 'Guía básica',
      plans: [],
    });
    expect(res.body.id).toBeDefined();
  });

  it('crea una guía con planes inline (201)', async () => {
    const res = await post(
      {
        modelId: modeloId,
        description: 'Guía completa',
        plans: [
          { description: 'Cambio de aceite', mileageInterval: 5000, isCritical: true },
          { description: 'Filtro de aire', mileageInterval: 10000, monthInterval: 12 },
        ],
      },
      adminToken,
    ).expect(201);

    expect(res.body.plans).toHaveLength(2);
    expect(res.body.plans[0]).toMatchObject({
      description: 'Cambio de aceite',
      mileageInterval: 5000,
      isCritical: true,
    });
    expect(res.body.plans[1]).toMatchObject({
      description: 'Filtro de aire',
      mileageInterval: 10000,
      monthInterval: 12,
      isCritical: false,
    });
  });

  it('devuelve la relación modelo+marca hidratada', async () => {
    const res = await post({ modelId: modeloId }, adminToken).expect(201);

    expect(res.body.modelo).toMatchObject({
      id: modeloId,
      nombre: 'TestModel 1.6',
      marca: { nombre: 'TestBrand' },
    });
  });

  it('400 si el modelo ya tiene una guía (unicidad por modelo)', async () => {
    await post({ modelId: modeloId }, adminToken).expect(201);
    const res = await post({ modelId: modeloId }, adminToken).expect(400);
    expect(res.body.message).toMatch(/ya existe/i);
  });

  it('404 si modelId no existe', async () => {
    await post({ modelId: 999999 }, adminToken).expect(404);
  });

  it('400 si modelId falta en el body', async () => {
    await post({ description: 'Sin modelo' }, adminToken).expect(400);
  });

  it('400 si plans[] está vacío (ArrayMinSize)', async () => {
    await post({ modelId: modeloId, plans: [] }, adminToken).expect(400);
  });

  it('400 si un plan le falta mileageInterval', async () => {
    await post({ modelId: modeloId, plans: [{ description: 'Sin intervalo' }] }, adminToken).expect(
      400,
    );
  });

  it('401 sin token', async () => {
    await post({ modelId: modeloId }).expect(401);
  });

  it('403 para Asesor Comercial (solo Admin puede crear guías)', async () => {
    await post({ modelId: modeloId }, asesorToken).expect(403);
  });
});
