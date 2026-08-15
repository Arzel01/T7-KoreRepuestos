import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp, seedTestUsers } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del carrito de compras (US#18–US#20 + cálculos de IVA).
 *
 * Siembra un producto determinista con stock conocido para no depender de los
 * datos del entorno. Corre contra el Postgres de test (CI efímero); sin Redis
 * ni servicios externos (arquitectura Postgres-nativa).
 */
describe('Cart (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  let productId: number;

  const SKU = 'E2E-CART-SKU';
  const PRICE = 100;
  const STOCK = 5;

  beforeAll(async () => {
    app = await createTestingApp();
    await seedTestUsers(app);
    ds = app.get<DataSource>(getDataSourceToken());

    // Producto determinista (idempotente entre corridas).
    const rows = (await ds.query(
      `INSERT INTO productos (sku, nombre, precio_base, stock_actual, is_active)
         VALUES ($1, 'Producto E2E Carrito', $2, $3, TRUE)
       ON CONFLICT (sku) DO UPDATE SET precio_base = EXCLUDED.precio_base,
                                       stock_actual = EXCLUDED.stock_actual,
                                       is_active = TRUE
       RETURNING id_producto`,
      [SKU, PRICE, STOCK],
    )) as Array<{ id_producto: number }>;
    productId = rows[0].id_producto;

    token = await login('test@kore.dev', 'Test1234!');
    // Estado inicial limpio.
    await request(app.getHttpServer())
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);
  });

  afterAll(async () => {
    // Vacía el carrito y elimina el producto sembrado (cascada sobre items).
    await request(app.getHttpServer())
      .delete('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);
    await ds.query(`DELETE FROM productos WHERE sku = $1`, [SKU]);
    await app.close();
  });

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { tokens: { accessToken: string } }).tokens.accessToken;
  }

  function auth(method: 'get' | 'post' | 'put' | 'delete', url: string) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
  }

  it('GET /cart sin token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/cart').expect(401);
  });

  it('GET /cart → carrito vacío con totales en cero', async () => {
    const res = await auth('get', '/api/v1/cart').expect(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.subtotal).toBe(0);
    expect(res.body.tax).toBe(0);
    expect(res.body.total).toBe(0);
    expect(res.body.taxRate).toBe(0.15);
  });

  it('POST /cart/items → añade producto (201)', async () => {
    const res = await auth('post', '/api/v1/cart/items')
      .send({ productId, quantity: 2 })
      .expect(201);
    expect(res.body.itemCount).toBe(2);
    expect(res.body.distinctCount).toBe(1);
  });

  it('POST /cart/items del mismo producto → previene duplicados (incrementa)', async () => {
    const res = await auth('post', '/api/v1/cart/items')
      .send({ productId, quantity: 1 })
      .expect(201);
    expect(res.body.itemCount).toBe(3);
    expect(res.body.distinctCount).toBe(1); // sigue siendo una sola línea
  });

  it('PUT /cart/items/:id → modifica cantidad y recalcula IVA', async () => {
    const cart = await auth('get', '/api/v1/cart').expect(200);
    const itemId = cart.body.items[0].id as number;

    const res = await auth('put', `/api/v1/cart/items/${itemId}`).send({ quantity: 5 }).expect(200);
    expect(res.body.itemCount).toBe(5);
    expect(res.body.subtotal).toBe(PRICE * 5); // 500
    expect(res.body.tax).toBe(75); // 500 * 0.15
    expect(res.body.total).toBe(575);
  });

  it('PUT /cart/items/:id con cantidad mayor al stock → 400', async () => {
    const cart = await auth('get', '/api/v1/cart').expect(200);
    const itemId = cart.body.items[0].id as number;
    await auth('put', `/api/v1/cart/items/${itemId}`)
      .send({ quantity: STOCK + 1 })
      .expect(400);
  });

  it('POST /cart/items con cantidad mayor al stock → 400', async () => {
    await auth('post', '/api/v1/cart/items').send({ productId, quantity: 999 }).expect(400);
  });

  it('DELETE /cart/items/:id → elimina la línea (200)', async () => {
    const cart = await auth('get', '/api/v1/cart').expect(200);
    const itemId = cart.body.items[0].id as number;

    const res = await auth('delete', `/api/v1/cart/items/${itemId}`).expect(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('POST /cart/items/bulk → alta masiva (US#5)', async () => {
    const res = await auth('post', '/api/v1/cart/items/bulk')
      .send({ items: [{ productId, quantity: 2 }] })
      .expect(201);
    expect(res.body.itemCount).toBe(2);
  });

  // TC-A-019: quantity=0 rechazado con error de validación
  it('PUT /cart/items/:id con quantity=0 → 400 (error de validación) (TC-A-019)', async () => {
    // Asegurar que hay un ítem en el carrito
    await auth('post', '/api/v1/cart/items').send({ productId, quantity: 1 }).expect(201);

    const cart = await auth('get', '/api/v1/cart').expect(200);
    const itemId = cart.body.items[0].id as number;

    await auth('put', `/api/v1/cart/items/${itemId}`).send({ quantity: 0 }).expect(400);
  });

  it('PUT /cart/items/:id con quantity negativa → 400 (TC-A-019)', async () => {
    await auth('post', '/api/v1/cart/items').send({ productId, quantity: 1 }).expect(201);

    const cart = await auth('get', '/api/v1/cart').expect(200);
    const itemId = cart.body.items[0].id as number;

    await auth('put', `/api/v1/cart/items/${itemId}`).send({ quantity: -1 }).expect(400);
  });
});
