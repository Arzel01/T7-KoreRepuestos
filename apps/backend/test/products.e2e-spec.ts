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

/**
 * Tests e2e de PUT /api/v1/products/:id — foco en la edición del SKU
 * (US#2 del acceptance report): antes de este cambio, `sku` no era un campo
 * editable en absoluto.
 */
describe('ProductsController PUT /api/v1/products/:id (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

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
  });

  async function createProduct(sku: string): Promise<number> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku, name: `Producto ${sku}`, price: 10, stock: 5 })
      .expect(201);
    return res.body.id;
  }

  it('permite cambiar el SKU a uno libre (200)', async () => {
    const id = await createProduct('SKU-ORIGINAL');

    const res = await request(app.getHttpServer())
      .put(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'SKU-NUEVO' })
      .expect(200);

    expect(res.body.sku).toBe('SKU-NUEVO');
  });

  it('rechaza cambiar el SKU a uno que ya usa otro producto (409)', async () => {
    await createProduct('SKU-A');
    const idB = await createProduct('SKU-B');

    await request(app.getHttpServer())
      .put(`/api/v1/products/${idB}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'SKU-A' })
      .expect(409);
  });

  it('permite reenviar el mismo SKU sin cambios (200, no es "colisión consigo mismo")', async () => {
    const id = await createProduct('SKU-SIN-CAMBIOS');

    await request(app.getHttpServer())
      .put(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'SKU-SIN-CAMBIOS', stock: 20 })
      .expect(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-A-001: Alta de producto — registro en logs_auditoria
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica que crear un producto registra un evento INSERT en logs_auditoria
 * y que el campo isActive es true en la respuesta (TC-A-001).
 */
describe('ProductsController POST /api/v1/products — audit log INSERT (TC-A-001)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE sesiones, logs_auditoria, productos, categorias, usuarios RESTART IDENTITY CASCADE',
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
  });

  it('crea producto con isActive=true en respuesta y registra INSERT en logs_auditoria (TC-A-001)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'FAT-001', name: 'Filtro de aceite FAT-001', price: 49.99, stock: 20 })
      .expect(201);

    expect(res.body.isActive).toBe(true);
    expect(res.body.sku).toBe('FAT-001');

    const logs: Array<{ accion: string; tabla_afectada: string }> = await dataSource.query(
      `SELECT accion, tabla_afectada FROM logs_auditoria
       WHERE tabla_afectada = 'productos' AND accion = 'INSERT'`,
    );
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].accion).toBe('INSERT');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-A-002: Edición de producto — precio/stock, catálogo y audit log UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica que actualizar precio y stock:
 *   - refleja los nuevos valores en GET /products/:id (catálogo público)
 *   - el catálogo paginado GET /products los muestra inmediatamente
 *   - logs_auditoria registra accion='UPDATE' para tabla 'productos'
 * (TC-A-002)
 */
describe('ProductsController PATCH /api/v1/products/:id — edición precio/stock (TC-A-002)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
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
      'TRUNCATE TABLE sesiones, logs_auditoria, productos, categorias, usuarios RESTART IDENTITY CASCADE',
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

    const productRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'FAT-001', name: 'Filtro de aceite FAT-001', price: 49.99, stock: 20 })
      .expect(201);
    productId = productRes.body.id as number;

    // Limpiar logs del INSERT para aislar los del UPDATE
    await dataSource.query('TRUNCATE TABLE logs_auditoria RESTART IDENTITY');
  });

  it('actualiza precio y stock — catálogo público refleja los nuevos valores inmediatamente (TC-A-002)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 75.0, stock: 50 })
      .expect(200);

    // Detalle público
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}`)
      .expect(200);
    expect(detail.body.price).toBe(75.0);
    expect(detail.body.stock).toBe(50);

    // Catálogo paginado
    const catalog = await request(app.getHttpServer()).get('/api/v1/products').expect(200);
    const updated = (
      catalog.body.items as Array<{ id: number; price: number; stock: number }>
    ).find((p) => p.id === productId);
    expect(updated).toBeDefined();
    expect(updated!.price).toBe(75.0);
    expect(updated!.stock).toBe(50);
  });

  it('registra accion=UPDATE en logs_auditoria para tabla productos (TC-A-002)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 60.0, stock: 30 })
      .expect(200);

    const logs: Array<{ accion: string; tabla_afectada: string }> = await dataSource.query(
      `SELECT accion, tabla_afectada FROM logs_auditoria
       WHERE tabla_afectada = 'productos' AND accion = 'UPDATE'`,
    );
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].accion).toBe('UPDATE');
  });

  it('PATCH precio <= 0 → 400 (validación intacta tras edición de campos)', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 0 })
      .expect(400);
  });

  it('PATCH stock negativo → 400', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stock: -5 })
      .expect(400);
  });

  it('PATCH producto inexistente → 404', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/products/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 10 })
      .expect(404);
  });
});
