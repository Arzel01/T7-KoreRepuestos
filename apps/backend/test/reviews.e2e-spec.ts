import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp, seedTestUsers } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * TC-A-009: Envío de reseña con calificación por estrellas.
 *
 * Prerequisito de negocio: el usuario debe haber comprado el producto
 * (la cotización creada liga al usuario con el producto en detalle_cotizacion).
 *
 * Cubre POST /api/v1/products/:id/reviews (ReviewsService):
 *   ✓ 401 sin token
 *   ✓ 403 si el usuario nunca compró el producto
 *   ✓ 201 con Review (id, rating, comment) — usuario comprador
 *   ✓ GET /products/:id/reviews refleja avgRating calculado
 *   ✓ 409 en segunda reseña del mismo usuario para el mismo producto
 *   ✓ 404 producto inexistente
 */
describe('ReviewsController (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let buyerToken: string;
  let productId: number;

  const SKU = 'E2E-REVIEW-SKU';

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { tokens: { accessToken: string } }).tokens.accessToken;
  }

  function authPost(url: string, tok: string) {
    return request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${tok}`);
  }

  beforeAll(async () => {
    app = await createTestingApp();
    await seedTestUsers(app);
    ds = app.get<DataSource>(getDataSourceToken());

    // Producto determinista
    const rows = await ds.query<Array<{ id_producto: number }>>(
      `INSERT INTO productos (sku, nombre, precio_base, stock_actual, is_active)
         VALUES ($1, 'Filtro E2E Review', 50, 20, TRUE)
       ON CONFLICT (sku) DO UPDATE SET is_active = TRUE
       RETURNING id_producto`,
      [SKU],
    );
    productId = rows[0].id_producto;

    buyerToken = await login('test@kore.dev', 'Test1234!');

    // Comprar el producto para habilitar la reseña
    await authPost('/api/v1/cart/items', buyerToken).send({ productId, quantity: 1 }).expect(201);
    await authPost('/api/v1/quotations', buyerToken).send({ clearCart: true }).expect(201);
  });

  afterAll(async () => {
    await ds.query(
      `DELETE FROM cotizaciones WHERE id_usuario IN
         (SELECT id_usuario FROM usuarios WHERE email = 'test@kore.dev')`,
    );
    await ds.query(`DELETE FROM productos WHERE sku = $1`, [SKU]);
    await app.close();
  });

  it('POST /products/:id/reviews sin token → 401', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/reviews`)
      .send({ rating: 5, comment: 'Excelente' })
      .expect(401);
  });

  it('POST /products/:id/reviews sin compra previa → 403 (TC-A-009)', async () => {
    const nobuyer = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'nobuyer-review@test.local',
        password: 'NoBuyer1A',
        firstName: 'No',
        lastName: 'Buyer',
      })
      .expect(201);

    await authPost(`/api/v1/products/${productId}/reviews`, nobuyer.body.tokens.accessToken)
      .send({ rating: 4, comment: 'Sin compra previa' })
      .expect(403);
  });

  it('POST → 201 con Review creada (TC-A-009)', async () => {
    const res = await authPost(`/api/v1/products/${productId}/reviews`, buyerToken)
      .send({ rating: 5, title: 'Excelente filtro', comment: 'Funciona perfecto.' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      rating: 5,
    });
  });

  it('GET /products/:id/reviews refleja avgRating calculado tras la reseña (TC-A-009)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/reviews`)
      .expect(200);

    expect(res.body.avgRating).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0]).toMatchObject({ rating: 5 });
  });

  it('POST segunda reseña del mismo usuario → 409 (TC-A-009)', async () => {
    await authPost(`/api/v1/products/${productId}/reviews`, buyerToken)
      .send({ rating: 3, comment: 'Segunda reseña — no debería funcionar' })
      .expect(409);
  });

  it('POST /products/99999/reviews → 404', async () => {
    await authPost('/api/v1/products/99999/reviews', buyerToken)
      .send({ rating: 4, comment: 'Producto inexistente' })
      .expect(404);
  });
});
