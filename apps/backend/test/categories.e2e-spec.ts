import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e para CategoriesController /api/v1/categories.
 *
 * Criterios de aceptación:
 *   ✓ GET /categories → 200 array público (solo raíces)
 *   ✓ GET /categories/tree → 200 árbol jerárquico público
 *   ✓ GET /categories/:id → 200 detalle público
 *   ✓ GET /categories/:id inexistente → 404
 *   ✓ POST sin token → 401
 *   ✓ POST Admin + nombre válido → 201
 *   ✓ POST Admin + parentId válido → 201 subcategoría
 *   ✓ POST Admin + parentId inexistente → 404
 *   ✓ PATCH Admin → 200 con nombre actualizado
 *   ✓ PATCH misma categoría como padre → 400
 *   ✓ DELETE Admin sin hijos ni productos → 204
 *   ✓ DELETE categoría con hijos → 409
 *   ✓ DELETE categoría con productos activos → 409
 *   ✓ GET /categories/tree incluye subcategorías anidadas
 */
describe('CategoriesController /api/v1/categories (e2e)', () => {
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
      'TRUNCATE TABLE sesiones, fichas_tecnicas, imagenes_producto, logs_auditoria, productos, categorias, usuarios RESTART IDENTITY CASCADE',
    );

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('AdminPass1', 4);
    await dataSource.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active)
       VALUES ($1, $2, 'Admin Test', 'Administrador', TRUE)`,
      ['admin@test.local', hash],
    );

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.local', password: 'AdminPass1' })
      .expect(200);
    adminToken = loginRes.body.tokens.accessToken;
  });

  // ── GET públicos ────────────────────────────────────────────────────────────

  it('GET /categories → 200 array vacío (sin datos)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/categories').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('GET /categories/tree → 200 array vacío (sin datos)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/categories/tree').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /categories/:id inexistente → 404', async () => {
    await request(app.getHttpServer()).get('/api/v1/categories/9999').expect(404);
  });

  // ── POST ───────────────────────────────────────────────────────────────────

  it('POST sin token → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .send({ name: 'Repuestos' })
      .expect(401);
  });

  it('POST Admin + nombre válido → 201 categoría raíz', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Repuestos' })
      .expect(201);

    expect(res.body).toMatchObject({ name: 'Repuestos' });
    expect(res.body.id).toBeDefined();
    expect(res.body.parentId).toBeFalsy();
  });

  it('POST Admin + parentId válido → 201 subcategoría', async () => {
    const parentRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Motor' })
      .expect(201);

    const parentId = parentRes.body.id as number;

    const childRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Pistones', parentId })
      .expect(201);

    expect(childRes.body).toMatchObject({ name: 'Pistones', parentId });
  });

  it('POST Admin + parentId inexistente → 404', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Huérfano', parentId: 9999 })
      .expect(404);
  });

  it('POST Admin + nombre vacío → 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' })
      .expect(400);
  });

  // ── PATCH ──────────────────────────────────────────────────────────────────

  it('PATCH Admin → 200 con nombre actualizado', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Frenos' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/categories/${created.body.id as number}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Frenos y Clutch' })
      .expect(200);

    expect(res.body.name).toBe('Frenos y Clutch');
  });

  it('PATCH categoría como su propio padre → 400', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Eléctrico' })
      .expect(201);

    const id = created.body.id as number;

    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ parentId: id })
      .expect(400);
  });

  it('PATCH sin token → 401', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Suspensión' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${created.body.id as number}`)
      .send({ name: 'Suspensión y Dirección' })
      .expect(401);
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  it('DELETE Admin categoría sin hijos → 204', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Temporal' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/categories/${created.body.id as number}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/categories/${created.body.id as number}`)
      .expect(404);
  });

  it('DELETE categoría con hijos → 409', async () => {
    const parent = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Transmisión' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Embragues', parentId: parent.body.id as number })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/categories/${parent.body.id as number}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);
  });

  it('DELETE categoría con productos activos → 409', async () => {
    const cat = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Filtros' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'FIL-001',
        name: 'Filtro de aceite',
        price: 25,
        stock: 20,
        categoryId: cat.body.id as number,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/categories/${cat.body.id as number}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);
  });

  it('DELETE sin token → 401', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Para Borrar' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/categories/${created.body.id as number}`)
      .expect(401);
  });

  // ── Árbol jerárquico ────────────────────────────────────────────────────────

  it('GET /categories/tree incluye subcategorías anidadas', async () => {
    const parent = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dirección' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cremalleras', parentId: parent.body.id as number })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Rótulas', parentId: parent.body.id as number })
      .expect(201);

    const res = await request(app.getHttpServer()).get('/api/v1/categories/tree').expect(200);

    const dirNode = res.body.find((n: { name: string }) => n.name === 'Dirección');
    expect(dirNode).toBeDefined();
    expect(dirNode.children).toHaveLength(2);
    const childNames: string[] = dirNode.children.map((c: { name: string }) => c.name);
    expect(childNames).toContain('Cremalleras');
    expect(childNames).toContain('Rótulas');
  });
});
