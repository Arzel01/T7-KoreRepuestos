import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del soft delete PATCH /api/v1/products/:id/deactivate.
 *
 * Cubre los criterios de aceptación:
 *   ✓ Marca isActive=false en lugar de borrar la fila
 *   ✓ Producto desactivado desaparece del catálogo (GET /products)
 *   ✓ Producto desactivado desaparece del detalle (GET /products/:id → 404)
 *   ✓ Admin y Asesor Comercial pueden desactivar (200)
 *   ✓ Cliente no puede (403)
 *   ✓ Sin token (401)
 *   ✓ 404 si el id no existe
 *   ✓ 404 si el producto ya estaba inactivo (no es idempotente: se trata
 *     igual que "no encontrado", mismo universo que el resto de endpoints públicos)
 */
describe('ProductsController PATCH /api/v1/products/:id/deactivate (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let asesorToken: string;
  let clientToken: string;
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

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('Password1', 4);

    await dataSource.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active) VALUES
       ('admin@test.local',  $1, 'Admin Test',  'Administrador',    TRUE),
       ('asesor@test.local', $1, 'Asesor Test', 'Asesor Comercial', TRUE)`,
      [hash],
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.local', password: 'Password1' })
      .expect(200);
    adminToken = adminLogin.body.tokens.accessToken;

    const asesorLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'asesor@test.local', password: 'Password1' })
      .expect(200);
    asesorToken = asesorLogin.body.tokens.accessToken;

    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'cliente@test.local',
        password: 'Password1',
        firstName: 'Cliente',
        lastName: 'Test',
      })
      .expect(201);
    clientToken = reg.body.tokens.accessToken;

    const rows: Array<{ id_producto: number; is_active: boolean }> = await dataSource.query(
      `INSERT INTO productos (sku, nombre, precio_base, stock_actual, is_active) VALUES
       ('SOFT-001', 'Producto activo',   25.50, 10, TRUE),
       ('SOFT-002', 'Producto inactivo', 30.00,  3, FALSE)
       RETURNING id_producto, is_active`,
    );
    activeId = rows.find((r) => r.is_active)!.id_producto;
    inactiveId = rows.find((r) => !r.is_active)!.id_producto;
  });

  const deactivate = (id: string | number, token?: string): request.Test => {
    const req = request(app.getHttpServer()).patch(`/api/v1/products/${id}/deactivate`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  it('Admin desactiva un producto activo (200) y marca isActive=false', async () => {
    const res = await deactivate(activeId, adminToken).expect(200);

    expect(res.body).toMatchObject({ id: activeId, sku: 'SOFT-001', isActive: false });

    const [row] = await dataSource.query('SELECT is_active FROM productos WHERE id_producto = $1', [
      activeId,
    ]);
    expect(row.is_active).toBe(false);
  });

  it('Asesor Comercial también puede desactivar (200)', async () => {
    await deactivate(activeId, asesorToken).expect(200);
  });

  it('el producto desactivado desaparece del catálogo', async () => {
    await deactivate(activeId, adminToken).expect(200);

    const res = await request(app.getHttpServer()).get('/api/v1/products').expect(200);
    const skus = res.body.items.map((p: { sku: string }) => p.sku);
    expect(skus).not.toContain('SOFT-001');
  });

  it('el producto desactivado desaparece de su propio detalle (404)', async () => {
    await deactivate(activeId, adminToken).expect(200);
    await request(app.getHttpServer()).get(`/api/v1/products/${activeId}`).expect(404);
  });

  it('rechaza la petición sin token (401)', async () => {
    await deactivate(activeId).expect(401);
  });

  it('rechaza la petición de un Cliente (403)', async () => {
    await deactivate(activeId, clientToken).expect(403);
  });

  it('devuelve 404 si el id no existe', async () => {
    await deactivate(999999, adminToken).expect(404);
  });

  it('devuelve 404 si el producto ya estaba inactivo (no es idempotente)', async () => {
    await deactivate(inactiveId, adminToken).expect(404);
  });

  it('devuelve 400 si el id no es numérico', async () => {
    await deactivate('abc', adminToken).expect(400);
  });
});
