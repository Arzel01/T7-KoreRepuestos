import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * TC-A-003: Soft-delete de producto desde el catálogo (Admin).
 *
 * Cubre DELETE /api/v1/products/:id:
 *   ✓ Admin → 204 (is_active = false en BD, no borrado físico)
 *   ✓ GET /products/:id tras borrado → 404 (oculto del público)
 *   ✓ GET /products (catálogo) excluye el producto borrado
 *   ✓ logs_auditoria registra accion='DELETE' para tabla 'productos'
 *   ✓ Sin token → 401
 *   ✓ Cliente → 403
 *   ✓ Producto inexistente → 404
 */
describe('ProductsController DELETE /api/v1/products/:id — soft delete (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let adminToken: string;
  let clientToken: string;
  let productId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    ds = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await ds.query(
      'TRUNCATE TABLE sesiones, logs_auditoria, productos, categorias, usuarios RESTART IDENTITY CASCADE',
    );

    const bcrypt = await import('bcrypt');
    const adminHash = await bcrypt.hash('AdminPass1', 4);
    await ds.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active)
       VALUES ($1, $2, 'Admin Delete Test', 'Administrador', TRUE)`,
      ['admin-del@test.local', adminHash],
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin-del@test.local', password: 'AdminPass1' })
      .expect(200);
    adminToken = adminLogin.body.tokens.accessToken;

    const clientReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'client-del@test.local',
        password: 'ClientDel1',
        firstName: 'Cliente',
        lastName: 'Del',
      })
      .expect(201);
    clientToken = clientReg.body.tokens.accessToken;

    const productRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'FAT-001', name: 'Filtro de aceite test', price: 25.5, stock: 10 })
      .expect(201);
    productId = productRes.body.id as number;
  });

  it('Admin → 204 y producto inaccesible vía GET :id (404) (TC-A-003)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    await request(app.getHttpServer()).get(`/api/v1/products/${productId}`).expect(404);
  });

  it('is_active pasa a false en BD (no es borrado físico) (TC-A-003)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const rows: Array<{ is_active: boolean }> = await ds.query(
      'SELECT is_active FROM productos WHERE id_producto = $1',
      [productId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].is_active).toBe(false);
  });

  it('producto soft-deleted queda excluido del catálogo público GET /products (TC-A-003)', async () => {
    const before = await request(app.getHttpServer()).get('/api/v1/products').expect(200);
    expect(before.body.items.some((p: { id: number }) => p.id === productId)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const after = await request(app.getHttpServer()).get('/api/v1/products').expect(200);
    expect(after.body.items.some((p: { id: number }) => p.id === productId)).toBe(false);
  });

  it('logs_auditoria registra accion=DELETE para tabla productos (TC-A-003)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const rows: Array<{ accion: string; tabla_afectada: string }> = await ds.query(
      `SELECT accion, tabla_afectada FROM logs_auditoria
       WHERE tabla_afectada = 'productos' AND accion = 'DELETE'`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].accion).toBe('DELETE');
    expect(rows[0].tabla_afectada).toBe('productos');
  });

  it('DELETE sin token → 401', async () => {
    await request(app.getHttpServer()).delete(`/api/v1/products/${productId}`).expect(401);
  });

  it('DELETE con cliente → 403', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
  });

  it('DELETE producto inexistente → 404', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/products/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
