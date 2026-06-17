import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del endpoint POST /api/v1/products.
 *
 * Cubre los criterios de aceptación:
 *   ✓ Sin token → 401
 *   ✓ Token de usuario Cliente → 403 (rol insuficiente)
 *   ✓ Token Administrador + payload válido → 201
 *   ✓ SKU duplicado → 409
 *   ✓ price <= 0 → 400
 *   ✓ stock negativo → 400
 *   ✓ Campos extra no declarados → 400
 */
describe('ProductsController POST /api/v1/products (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let clientToken: string;

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

    // Admin insertado directo en BD (el endpoint de registro solo crea clientes).
    const adminEmail = 'admin@test.local';
    const adminPassword = 'AdminPass1';
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(adminPassword, 4);
    await dataSource.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active)
       VALUES ($1, $2, 'Admin Test', 'Administrador', TRUE)`,
      [adminEmail, hash],
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    adminToken = adminLogin.body.tokens.accessToken;

    // Cliente mediante el endpoint público de registro.
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

  it('crea un producto con admin + payload válido (201)', async () => {
    const payload = { sku: 'TEST-001', name: 'Producto de prueba', price: 99.99, stock: 10 };

    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      sku: payload.sku,
      name: payload.name,
      price: 99.99,
      stock: 10,
      isActive: true,
    });
  });

  it('rechaza la petición sin token (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .send({ sku: 'X', name: 'X', price: 1, stock: 1 })
      .expect(401);
  });

  it('rechaza la petición de un cliente (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ sku: 'TEST-002', name: 'Pieza', price: 50, stock: 5 })
      .expect(403);
  });

  it('rechaza price <= 0 con 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'TEST-003', name: 'X', price: 0, stock: 5 })
      .expect(400);
  });

  it('rechaza stock negativo con 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'TEST-004', name: 'X', price: 5, stock: -1 })
      .expect(400);
  });

  it('rechaza SKU duplicado con 409', async () => {
    const payload = { sku: 'DUP-001', name: 'Producto', price: 10, stock: 1 };
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(409);
  });

  it('rechaza campos extra no declarados con 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'TEST-005', name: 'X', price: 1, stock: 1, secretAdminFlag: true })
      .expect(400);
  });
});
