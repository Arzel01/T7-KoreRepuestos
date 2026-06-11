import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del endpoint POST /api/v1/products (US#45).
 *
 * Cubre los criterios de aceptación:
 *   ✓ Sin token → 401
 *   ✓ Token de usuario CLIENTE → 403 (Forbidden, rol insuficiente)
 *   ✓ Token de usuario ADMIN + payload válido → 201
 *   ✓ SKU duplicado → 409
 *   ✓ price <= 0 → 400 (validation)
 *   ✓ stock <= 0 → 400 (validation)
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
      'TRUNCATE TABLE sessions, products, product_categories, users RESTART IDENTITY CASCADE',
    );

    // Creamos un admin INSERTANDO directo en BD para saltar el flujo
    // de "register devuelve cliente". Luego logueamos para obtener el JWT.
    const adminEmail = 'admin@test.local';
    const adminPassword = 'AdminPass1';
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(adminPassword, 4);
    await dataSource.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, is_active)
       VALUES ($1, $2, 'Admin', 'Test', 'admin', TRUE, TRUE)`,
      [adminEmail, hash],
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    adminToken = adminLogin.body.tokens.accessToken;

    // Un usuario cliente normal mediante el endpoint público de registro.
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

  // ---------------------------------------------------------------------------
  // Casos exitosos
  // ---------------------------------------------------------------------------
  it('crea un producto con admin + payload válido (201)', async () => {
    const payload = {
      sku: 'TEST-001',
      name: 'Producto de prueba',
      price: 99.99,
      stock: 10,
    };

    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      sku: payload.sku,
      name: payload.name,
      price: 99.99,
      stock: 10,
      isActive: true,
    });
  });

  // ---------------------------------------------------------------------------
  // Autorización
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Validación de payload
  // ---------------------------------------------------------------------------
  it('rechaza price <= 0 con 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'TEST-003', name: 'X', price: 0, stock: 5 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'TEST-003', name: 'X', price: -1, stock: 5 })
      .expect(400);
  });

  it('rechaza stock <= 0 con 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'TEST-004', name: 'X', price: 5, stock: 0 })
      .expect(400);
  });

  it('rechaza SKU duplicado con 409', async () => {
    const payload = {
      sku: 'DUP-001',
      name: 'Producto',
      price: 10,
      stock: 1,
    };
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
      .send({
        sku: 'TEST-005',
        name: 'X',
        price: 1,
        stock: 1,
        secretAdminFlag: true,
      })
      .expect(400);
  });
});
