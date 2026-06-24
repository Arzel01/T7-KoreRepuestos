import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

describe('MaintenanceController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE productos_tarea, historial_mantenimiento, tareas_mantenimiento, guias_mantenimiento, vehiculos_usuario, modelos, marcas, sesiones, usuarios RESTART IDENTITY CASCADE',
    );

    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'maintenance@test.local',
        password: 'StrongPass1',
        firstName: 'Maint',
        lastName: 'Tester',
      })
      .expect(201);

    token = reg.body.tokens.accessToken;
  });

  async function seedModel(
    brandName: string,
    modelName: string,
  ): Promise<{ brandId: number; modelId: number }> {
    const [brand] = await dataSource.query(
      'INSERT INTO marcas (nombre) VALUES ($1) RETURNING id_marca',
      [brandName],
    );

    const [model] = await dataSource.query(
      'INSERT INTO modelos (id_marca, nombre) VALUES ($1, $2) RETURNING id_modelo',
      [brand.id_marca, modelName],
    );

    return { brandId: Number(brand.id_marca), modelId: Number(model.id_modelo) };
  }

  it('rechaza acceso sin token (401)', async () => {
    await request(app.getHttpServer()).get('/api/v1/maintenance/guides').expect(401);
  });

  it('crea una guía de mantenimiento válida (201)', async () => {
    const { brandId, modelId } = await seedModel('Toyota', 'Corolla');

    const res = await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${token}`)
      .send({ modelId, description: 'Guía 10k' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      modelId,
      modelName: 'Corolla',
      brandId,
      brandName: 'Toyota',
      description: 'Guía 10k',
      tasks: [],
    });
  });

  it('rechaza creación de guía con modelo inexistente (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${token}`)
      .send({ modelId: 99999, description: 'No válida' })
      .expect(400);
  });

  it('crea tarea en guía existente y la retorna en listado de guías (201/200)', async () => {
    const { modelId } = await seedModel('Kia', 'Sportage');

    const createdGuide = await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${token}`)
      .send({ modelId, description: 'Guía SUV' })
      .expect(201);

    const guideId = createdGuide.body.id as number;

    const createdTask = await request(app.getHttpServer())
      .post(`/api/v1/maintenance/guides/${guideId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Cambio de aceite',
        mileageInterval: 10000,
        monthInterval: 6,
        isCritical: true,
      })
      .expect(201);

    expect(createdTask.body).toMatchObject({
      id: expect.any(Number),
      description: 'Cambio de aceite',
      mileageInterval: 10000,
      monthInterval: 6,
      isCritical: true,
      parts: 0,
    });

    const guides = await request(app.getHttpServer())
      .get('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(guides.body).toHaveLength(1);
    expect(guides.body[0]).toMatchObject({
      id: guideId,
      modelName: 'Sportage',
      brandName: 'Kia',
      tasks: [
        expect.objectContaining({
          description: 'Cambio de aceite',
          mileageInterval: 10000,
          isCritical: true,
        }),
      ],
    });
  });

  it('lista tareas filtradas por marca y modelo (200)', async () => {
    const a = await seedModel('Toyota', 'Corolla');
    const b = await seedModel('Nissan', 'Sentra');

    const guideA = await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${token}`)
      .send({ modelId: a.modelId, description: 'Guía A' })
      .expect(201);

    const guideB = await request(app.getHttpServer())
      .post('/api/v1/maintenance/guides')
      .set('Authorization', `Bearer ${token}`)
      .send({ modelId: b.modelId, description: 'Guía B' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/maintenance/guides/${guideA.body.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Filtro aceite', mileageInterval: 10000 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/maintenance/guides/${guideB.body.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Filtro aire', mileageInterval: 15000 })
      .expect(201);

    const byBrand = await request(app.getHttpServer())
      .get(`/api/v1/maintenance/tasks?brandId=${a.brandId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(byBrand.body).toHaveLength(1);
    expect(byBrand.body[0]).toMatchObject({
      brandId: a.brandId,
      modelId: a.modelId,
      brandName: 'Toyota',
      modelName: 'Corolla',
      description: 'Filtro aceite',
    });

    const byModel = await request(app.getHttpServer())
      .get(`/api/v1/maintenance/tasks?modelId=${b.modelId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(byModel.body).toHaveLength(1);
    expect(byModel.body[0]).toMatchObject({
      brandId: b.brandId,
      modelId: b.modelId,
      brandName: 'Nissan',
      modelName: 'Sentra',
      description: 'Filtro aire',
    });
  });
});
