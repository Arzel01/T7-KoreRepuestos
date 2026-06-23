import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e para PUT+PATCH /api/v1/products/:id y DELETE /api/v1/products/:id.
 *
 * Criterios de aceptación:
 *   ✓ PATCH sin token → 401
 *   ✓ PATCH con token de Cliente → 403
 *   ✓ PATCH Admin + payload válido → 200 con campos actualizados
 *   ✓ PATCH price = 0 → 400
 *   ✓ PATCH producto inexistente → 404
 *   ✓ PUT sin token → 401
 *   ✓ PUT con token de Cliente → 403
 *   ✓ PUT Admin + payload válido → 200 con campos actualizados
 *   ✓ PUT price = 0 → 400
 *   ✓ PUT producto inexistente → 404
 *   ✓ DELETE sin token → 401
 *   ✓ DELETE Admin → 204 y producto queda isActive=false
 *   ✓ DELETE producto inexistente → 404
 */
describe('ProductsController PUT+PATCH & DELETE /api/v1/products/:id (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let clientToken: string;
  let productId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE sesiones, fichas_tecnicas, imagenes_producto, logs_auditoria, productos, categorias, usuarios RESTART IDENTITY CASCADE',
    );

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('AdminPass1', 4);
    await dataSource.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active)
       VALUES ($1, $2, 'Admin Test', 'Administrador', TRUE)`,
      ['admin@test.local', hash],
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.local', password: 'AdminPass1' })
      .expect(200);
    adminToken = adminLogin.body.tokens.accessToken;

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

    const created = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'UPD-001', name: 'Producto original', price: 50, stock: 5 })
      .expect(201);
    productId = created.body.id as number;
  });

  // ── PATCH ──────────────────────────────────────────────────────────────────

  it('PATCH sin token → 401', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}`)
      .send({ name: 'Nuevo nombre' })
      .expect(401);
  });

  it('PATCH con token de Cliente → 403', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Nuevo nombre' })
      .expect(403);
  });

  it('PATCH Admin + payload válido → 200 con campos actualizados', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Nombre actualizado', price: 75.5 })
      .expect(200);

    expect(res.body).toMatchObject({
      id: productId,
      name: 'Nombre actualizado',
      price: 75.5,
      sku: 'UPD-001',
    });
  });

  it('PATCH price = 0 → 400', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 0 })
      .expect(400);
  });

  it('PATCH producto inexistente → 404', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/products/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' })
      .expect(404);
  });

  // ── PUT ────────────────────────────────────────────────────────────────────

  it('PUT sin token → 401', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/products/${productId}`)
      .send({ name: 'Nuevo nombre' })
      .expect(401);
  });

  it('PUT con token de Cliente → 403', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Nuevo nombre' })
      .expect(403);
  });

  it('PUT Admin + payload válido → 200 con campos actualizados', async () => {
    const res = await request(app.getHttpServer())
      .put(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Nombre via PUT', price: 99.9 })
      .expect(200);

    expect(res.body).toMatchObject({
      id: productId,
      name: 'Nombre via PUT',
      price: 99.9,
      sku: 'UPD-001',
    });
  });

  it('PUT price = 0 → 400', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 0 })
      .expect(400);
  });

  it('PUT producto inexistente → 404', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/products/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' })
      .expect(404);
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  it('DELETE sin token → 401', async () => {
    await request(app.getHttpServer()).delete(`/api/v1/products/${productId}`).expect(401);
  });

  it('DELETE Admin → 204 y producto queda isActive=false', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const check = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}`)
      .expect(200);
    expect(check.body.isActive).toBe(false);
  });

  it('DELETE producto inexistente → 404', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/products/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
