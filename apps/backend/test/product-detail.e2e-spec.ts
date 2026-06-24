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
