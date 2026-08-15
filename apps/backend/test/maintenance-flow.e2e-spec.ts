import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp, seedTestUsers } from './setup-e2e';

import type { VehiclePlanResponse } from '@kore/shared';
import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Flujo de mantenimiento de punta a punta (US#2 + US#3 · AO):
 * registrar vehículo → actualizar kilometraje → plan con costo → recordatorio
 * encolado → centro in-app → marcar leído → preferencias. Sin Redis/SMTP.
 */
describe('Maintenance flow (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  let modelId: number;
  let brandId: number;
  let productPrice: number;

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { tokens: { accessToken: string } }).tokens.accessToken;
  }

  async function seedCatalog(): Promise<void> {
    await ds.query(
      `INSERT INTO marcas (nombre) VALUES ('E2E Mant Marca') ON CONFLICT (nombre) DO NOTHING`,
    );
    [{ id_marca: brandId }] = await ds.query(
      `SELECT id_marca FROM marcas WHERE nombre = 'E2E Mant Marca'`,
    );

    await ds.query(
      `INSERT INTO modelos (id_marca, nombre) VALUES ($1, 'E2E Mant Modelo')
       ON CONFLICT (id_marca, nombre) DO NOTHING`,
      [brandId],
    );
    [{ id_modelo: modelId }] = await ds.query(
      `SELECT id_modelo FROM modelos WHERE id_marca = $1 AND nombre = 'E2E Mant Modelo'`,
      [brandId],
    );

    productPrice = 120;
    await ds.query(
      `INSERT INTO productos (sku, nombre, precio_base, stock_actual, is_active)
       VALUES ('E2E-MANT-001', 'Filtro E2E', $1, 10, TRUE)
       ON CONFLICT (sku) DO NOTHING`,
      [productPrice],
    );
    const [{ id_producto: productId }] = await ds.query(
      `SELECT id_producto FROM productos WHERE sku = 'E2E-MANT-001'`,
    );

    await ds.query(
      `INSERT INTO guias_mantenimiento (id_modelo, descripcion)
       SELECT $1, 'E2E guia'
       WHERE NOT EXISTS (SELECT 1 FROM guias_mantenimiento WHERE id_modelo = $1 AND descripcion = 'E2E guia')`,
      [modelId],
    );
    const [{ id_guia: guideId }] = await ds.query(
      `SELECT id_guia FROM guias_mantenimiento WHERE id_modelo = $1 AND descripcion = 'E2E guia' LIMIT 1`,
      [modelId],
    );

    await ds.query(
      `INSERT INTO tareas_mantenimiento (id_guia, descripcion_tarea, intervalo_kilometraje, es_critica)
       SELECT $1, 'Cambio de aceite E2E', 5000, TRUE
       WHERE NOT EXISTS (
         SELECT 1 FROM tareas_mantenimiento WHERE id_guia = $1 AND descripcion_tarea = 'Cambio de aceite E2E'
       )`,
      [guideId],
    );
    const [{ id_tarea: taskId }] = await ds.query(
      `SELECT id_tarea FROM tareas_mantenimiento WHERE id_guia = $1 AND descripcion_tarea = 'Cambio de aceite E2E' LIMIT 1`,
      [guideId],
    );

    await ds.query(
      `INSERT INTO productos_tarea (id_tarea, id_producto, cantidad) VALUES ($1, $2, 2)
       ON CONFLICT (id_tarea, id_producto) DO NOTHING`,
      [taskId, productId],
    );
  }

  async function createVehicle(mileage: number): Promise<number> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ brandId, modelId, year: 2020, currentMileage: mileage })
      .expect(201);
    return (res.body as { id: number }).id;
  }

  beforeAll(async () => {
    app = await createTestingApp();
    await seedTestUsers(app);
    ds = app.get<DataSource>(getDataSourceToken());
    token = await login('test@kore.dev', 'Test1234!');
    await seedCatalog();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /vehicles/:id/plan agrega el costo estimado (price × quantity)', async () => {
    const vehicleId = await createVehicle(4000);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}/plan`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const plan = res.body as VehiclePlanResponse;
    const task = plan.services.find((s) => s.description === 'Cambio de aceite E2E');
    expect(task).toBeDefined();
    expect(task!.estimatedCost).toBe(productPrice * 2); // 240
    expect(plan.estimatedTotalCost).toBeGreaterThanOrEqual(productPrice * 2);
    expect(plan.overdueCount).toBe(0); // a 4000 km aún no vence (siguiente a 5000)
  });

  it('actualizar el kilometraje encola un recordatorio in-app y aparece en el centro', async () => {
    const vehicleId = await createVehicle(4000);

    await request(app.getHttpServer())
      .patch(`/api/v1/vehicles/${vehicleId}/mileage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentMileage: 5000 }) // cae justo en el intervalo → vencido
      .expect(204);

    const list = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then((r) => r.body as Array<{ id: number; vehicleId?: number; canal: string }>);

    const mine = list.find((n) => n.vehicleId === vehicleId);
    expect(mine).toBeDefined();
    expect(mine!.canal).toBe('app');

    // El plan ahora reporta el servicio vencido.
    const plan = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}/plan`)
      .set('Authorization', `Bearer ${token}`)
      .then((r) => r.body as VehiclePlanResponse);
    expect(plan.overdueCount).toBeGreaterThanOrEqual(1);

    // Marcar como leída baja el contador de no leídas.
    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${mine!.id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const [row] = await ds.query(
      'SELECT estado, leida_en FROM notificaciones WHERE id_notificacion = $1',
      [mine!.id],
    );
    expect(row.estado).toBe('leida');
    expect(row.leida_en).not.toBeNull();
  });

  it('respeta las preferencias: con email desactivado no encola el canal email', async () => {
    // Desactivar email, mantener app.
    await request(app.getHttpServer())
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ emailChannel: false, appChannel: true })
      .expect(200);

    const vehicleId = await createVehicle(4000);
    await request(app.getHttpServer())
      .patch(`/api/v1/vehicles/${vehicleId}/mileage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentMileage: 5000 })
      .expect(204);

    const emailRows = await ds.query(
      "SELECT COUNT(*)::int AS c FROM notificaciones WHERE id_vehiculo_usuario = $1 AND canal = 'email'",
      [vehicleId],
    );
    const appRows = await ds.query(
      "SELECT COUNT(*)::int AS c FROM notificaciones WHERE id_vehiculo_usuario = $1 AND canal = 'app'",
      [vehicleId],
    );
    expect(emailRows[0].c).toBe(0);
    expect(appRows[0].c).toBeGreaterThanOrEqual(1);
  });

  it('GET /notifications sin token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/notifications').expect(401);
  });

  // ── TC-A-011: Calendario de mantenimiento con CalendarItemDto ───────────────

  it('GET /vehicles/:id/calendar → 200 array de CalendarItemDto con kmRemaining y products (TC-A-011)', async () => {
    const vehicleId = await createVehicle(4000);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}/calendar`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    // Puede estar vacío si no hay guía vinculada al modelo; si hay items validamos el shape
    if ((res.body as unknown[]).length > 0) {
      const item = res.body[0] as Record<string, unknown>;
      expect(item).toMatchObject({
        planId: expect.any(Number),
        description: expect.any(String),
        mileageInterval: expect.any(Number),
        isCritical: expect.any(Boolean),
        kmRemaining: expect.any(Number),
        nextServiceDate: expect.any(String),
        estimatedCost: expect.any(Number),
        products: expect.any(Array),
      });
    }
  });

  it('GET /calendar incluye la tarea sembrada con kmRemaining calculado (TC-A-011)', async () => {
    const vehicleId = await createVehicle(4000);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}/calendar`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const oilChange = (
      res.body as Array<{ description: string; kmRemaining: number; products: unknown[] }>
    ).find((s) => s.description === 'Cambio de aceite E2E');

    expect(oilChange).toBeDefined();
    // A 4000 km con intervalo 5000 → kmRemaining = 1000
    expect(oilChange!.kmRemaining).toBe(1000);
    // El producto sembrado (E2E-MANT-001) debe estar en la lista de partes
    expect(oilChange!.products.length).toBeGreaterThanOrEqual(1);
  });

  // ── TC-A-014: Recordatorio con estado='pendiente' ───────────────────────────

  it('notificación encolada tras mileage update tiene estado=pendiente en BD (TC-A-014)', async () => {
    const vehicleId = await createVehicle(4000);

    await request(app.getHttpServer())
      .patch(`/api/v1/vehicles/${vehicleId}/mileage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentMileage: 5000 })
      .expect(204);

    const rows: Array<{ estado: string }> = await ds.query(
      `SELECT estado FROM notificaciones
       WHERE id_vehiculo_usuario = $1
       ORDER BY id_notificacion DESC LIMIT 1`,
      [vehicleId],
    );

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].estado).toBe('pendiente');
  });

  // ── TC-A-015: Plan secuencial + recalculación dinámica ─────────────────────

  it('servicios del plan están ordenados por nextServiceDate ascendente (TC-A-015)', async () => {
    const vehicleId = await createVehicle(1000);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}/plan`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const dates = (res.body.services as Array<{ nextServiceDate: string }>).map(
      (s) => s.nextServiceDate,
    );

    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i]).getTime()).toBeGreaterThanOrEqual(new Date(dates[i - 1]).getTime());
    }
  });

  it('el plan se recalcula dinámicamente al actualizar el kilometraje (TC-A-015)', async () => {
    const vehicleId = await createVehicle(4000);

    const planBefore = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}/plan`)
      .set('Authorization', `Bearer ${token}`)
      .then((r) => r.body as { overdueCount: number });

    expect(planBefore.overdueCount).toBe(0); // a 4000 no hay vencidos

    // Actualizar a 5000 → tarea con intervalo 5000 queda vencida
    await request(app.getHttpServer())
      .patch(`/api/v1/vehicles/${vehicleId}/mileage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentMileage: 5000 })
      .expect(204);

    const planAfter = await request(app.getHttpServer())
      .get(`/api/v1/vehicles/${vehicleId}/plan`)
      .set('Authorization', `Bearer ${token}`)
      .then((r) => r.body as { overdueCount: number });

    expect(planAfter.overdueCount).toBeGreaterThanOrEqual(1);
  });
});
