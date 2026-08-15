import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del detalle público GET /api/v1/products/:id.
 *
 * Cubre los criterios de aceptación:
 *   ✓ 200 con el producto si existe y está activo
 *   ✓ 404 si no existe
 *   ✓ 404 si existe pero está inactivo (no se trata como "no encontrado" en BD,
 *     sino oculto del público — mismo código que "no existe" por seguridad)
 *   ✓ Validación de id (no numérico, decimal, negativo) → 400
 *   ✓ Forma del payload de error estandarizada (statusCode, message)
 */
describe('ProductsController GET /api/v1/products/:id — detalle (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let activeId: number;
  let inactiveId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE sesiones, productos, categorias, usuarios RESTART IDENTITY CASCADE',
    );

    const rows: Array<{ id_producto: number; is_active: boolean }> = await dataSource.query(
      `INSERT INTO productos (sku, nombre, precio_base, stock_actual, is_active) VALUES
       ('DET-001', 'Producto activo',   25.50, 10, TRUE),
       ('DET-002', 'Producto inactivo', 30.00,  3, FALSE)
       RETURNING id_producto, is_active`,
    );
    activeId = rows.find((r) => r.is_active)!.id_producto;
    inactiveId = rows.find((r) => !r.is_active)!.id_producto;
  });

  const get = (id: string | number): request.Test =>
    request(app.getHttpServer()).get(`/api/v1/products/${id}`);

  it('devuelve 200 con el producto si existe y está activo', async () => {
    const res = await get(activeId).expect(200);

    expect(res.body).toMatchObject({
      id: activeId,
      sku: 'DET-001',
      name: 'Producto activo',
      price: 25.5,
      stock: 10,
      isActive: true,
    });
    // Guard de regresión: numeric(12,2) debe llegar como number, no string.
    expect(typeof res.body.price).toBe('number');
  });

  it('no requiere autenticación (endpoint público)', async () => {
    await get(activeId).expect(200);
  });

  it('devuelve 404 si el id no existe', async () => {
    const res = await get(999999).expect(404);
    expect(res.body).toMatchObject({ statusCode: 404 });
    expect(typeof res.body.message).toBe('string');
  });

  it('devuelve 404 si el producto existe pero está inactivo', async () => {
    const res = await get(inactiveId).expect(404);
    expect(res.body).toMatchObject({ statusCode: 404 });
  });

  it('devuelve 400 si el id no es numérico', async () => {
    await get('abc').expect(400);
  });

  it('devuelve 400 si el id es decimal', async () => {
    await get('1.5').expect(400);
  });

  it('devuelve 400 si el id es negativo o cero', async () => {
    await get(-1).expect(400);
    await get(0).expect(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-A-008: Detalle enriquecido — compatibilidad y reseñas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TC-A-008: Vista de detalle de producto incluye:
 *   ✓ Vehículos compatibles via GET /products/:id/compatibility
 *   ✓ avgRating y total en GET /products/:id/reviews (calculado dinámicamente)
 *   ✓ Endpoint de compatibilidad es público (sin auth)
 *   ✓ Producto inexistente en compatibilidad → 404
 */
describe('ProductsController GET /api/v1/products/:id — detalle enriquecido (TC-A-008)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let productId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());

    await dataSource.query(
      'TRUNCATE TABLE sesiones, compatibilidad, productos, categorias, usuarios RESTART IDENTITY CASCADE',
    );

    const [{ id_producto }] = await dataSource.query<Array<{ id_producto: number }>>(
      `INSERT INTO productos (sku, nombre, precio_base, stock_actual, is_active)
       VALUES ('DET-ENR-001', 'Producto Detalle Enriquecido', 80.00, 15, TRUE)
       RETURNING id_producto`,
    );
    productId = id_producto;

    // Compatibilidad directa en BD — modelo normalizado: marca/modelo son
    // tablas aparte, `compatibilidad` solo enlaza (id_producto, id_modelo).
    const [{ id_marca }] = await dataSource.query<Array<{ id_marca: number }>>(
      `INSERT INTO marcas (nombre) VALUES ('Chevrolet')
       ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id_marca`,
    );
    const [{ id_modelo }] = await dataSource.query<Array<{ id_modelo: number }>>(
      `INSERT INTO modelos (id_marca, nombre, anio_inicio, anio_fin)
       VALUES ($1, 'Spark', 2017, 2022)
       ON CONFLICT (id_marca, nombre)
         DO UPDATE SET anio_inicio = EXCLUDED.anio_inicio, anio_fin = EXCLUDED.anio_fin
       RETURNING id_modelo`,
      [id_marca],
    );
    await dataSource.query(
      `INSERT INTO compatibilidad (id_producto, id_modelo) VALUES ($1, $2)
       ON CONFLICT (id_producto, id_modelo) DO NOTHING`,
      [productId, id_modelo],
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products/:id/compatibility → 200 array público con datos del vehículo (TC-A-008)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/compatibility`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const entry = res.body[0];
    // La respuesta incluye al menos la información de la marca y el modelo
    expect(entry).toMatchObject(
      expect.objectContaining({
        brandName: 'Chevrolet',
        modelName: 'Spark',
      }),
    );
  });

  it('GET /products/:id/compatibility no requiere autenticación (público) (TC-A-008)', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/compatibility`)
      .expect(200);
  });

  it('GET /products/99999/compatibility → 404', async () => {
    await request(app.getHttpServer()).get('/api/v1/products/99999/compatibility').expect(404);
  });

  it('GET /products/:id/reviews → 200 con avgRating y total (TC-A-008)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/reviews`)
      .expect(200);

    // Sin reseñas para este producto, averageRating es null (no 0) — ver
    // reviews.repository.ts: solo es número cuando AVG() tiene filas.
    expect(res.body).toMatchObject({
      averageRating: null,
      total: expect.any(Number),
      items: expect.any(Array),
    });
  });
});
