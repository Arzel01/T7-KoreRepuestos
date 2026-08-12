import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp, seedTestUsers } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e de cotizaciones (US#22) + resumen de carrito (US#21).
 *
 * Corre contra el Postgres de test (CI efímero), sin SMTP: el email usa el
 * transporte simulado (`jsonTransport`), así que `delivered` es false pero el
 * flujo se ejercita completo. El PDF se genera con pdfkit (JS puro, sin red).
 */
describe('Quotations (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  let productId: number;

  const SKU = 'E2E-QUOTE-SKU';
  const PRICE = 100;
  const STOCK = 20;

  beforeAll(async () => {
    app = await createTestingApp();
    await seedTestUsers(app);
    ds = app.get<DataSource>(getDataSourceToken());

    const rows = (await ds.query(
      `INSERT INTO productos (sku, nombre, precio_base, stock_actual, is_active)
         VALUES ($1, 'Producto E2E Cotización', $2, $3, TRUE)
       ON CONFLICT (sku) DO UPDATE SET precio_base = EXCLUDED.precio_base,
                                       stock_actual = EXCLUDED.stock_actual,
                                       is_active = TRUE
       RETURNING id_producto`,
      [SKU, PRICE, STOCK],
    )) as Array<{ id_producto: number }>;
    productId = rows[0].id_producto;

    token = await login('test@kore.dev', 'Test1234!');
    await auth('delete', '/api/v1/cart');
  });

  afterAll(async () => {
    await auth('delete', '/api/v1/cart');
    // Limpia cotizaciones del usuario de prueba y el producto sembrado.
    await ds.query(
      `DELETE FROM cotizaciones WHERE id_usuario IN (SELECT id_usuario FROM usuarios WHERE email = 'test@kore.dev')`,
    );
    await ds.query(`DELETE FROM productos WHERE sku = $1`, [SKU]);
    await ds.query(`DELETE FROM usuarios WHERE email = 'other-user@kore.dev'`);
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

  it('GET /cart/summary sin token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/cart/summary').expect(401);
  });

  it('GET /cart/summary → resumen vacío con canQuote=false', async () => {
    const res = await auth('get', '/api/v1/cart/summary').expect(200);
    expect(res.body.itemCount).toBe(0);
    expect(res.body.total).toBe(0);
    expect(res.body.canQuote).toBe(false);
  });

  it('POST /quotations con carrito vacío → 400', async () => {
    await auth('post', '/api/v1/quotations').send({}).expect(400);
  });

  it('GET /cart/summary con ítems → canQuote=true y totales', async () => {
    await auth('post', '/api/v1/cart/items').send({ productId, quantity: 3 }).expect(201);
    const res = await auth('get', '/api/v1/cart/summary').expect(200);
    expect(res.body.itemCount).toBe(3);
    expect(res.body.subtotal).toBe(300);
    expect(res.body.tax).toBe(54); // 300 * 0.18
    expect(res.body.total).toBe(354);
    expect(res.body.canQuote).toBe(true);
  });

  let quotationId: number;
  let quotationNumber: string;

  it('POST /quotations → genera cotización con líneas y totales (201)', async () => {
    const res = await auth('post', '/api/v1/quotations')
      .send({ validityDays: 30, clearCart: true })
      .expect(201);

    expect(res.body.number).toMatch(/^COT-\d{4}-\d{6}$/);
    expect(res.body.status).toBe('Pendiente');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].unitPrice).toBe(100);
    expect(res.body.subtotal).toBe(300);
    expect(res.body.tax).toBe(54);
    expect(res.body.total).toBe(354);
    expect(res.body.expired).toBe(false);

    quotationId = res.body.id;
    quotationNumber = res.body.number;
  });

  it('vació el carrito tras cotizar (clearCart por defecto)', async () => {
    const res = await auth('get', '/api/v1/cart/summary').expect(200);
    expect(res.body.itemCount).toBe(0);
  });

  it('congela el precio: subir precio_base no altera la cotización emitida', async () => {
    await ds.query(`UPDATE productos SET precio_base = 999 WHERE sku = $1`, [SKU]);
    const res = await auth('get', `/api/v1/quotations/${quotationId}`).expect(200);
    expect(res.body.items[0].unitPrice).toBe(100); // congelado
    // Restaura para no afectar otras suites.
    await ds.query(`UPDATE productos SET precio_base = $2 WHERE sku = $1`, [SKU, PRICE]);
  });

  it('GET /quotations → historial del usuario', async () => {
    const res = await auth('get', '/api/v1/quotations').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((q: { id: number }) => q.id === quotationId)).toBe(true);
  });

  it('GET /quotations/:id/pdf → application/pdf con firma %PDF', async () => {
    const res = await auth('get', `/api/v1/quotations/${quotationId}/pdf`)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain(`${quotationNumber}.pdf`);
    const body = res.body as Buffer;
    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('POST /quotations/:id/email → prepara el envío (simulado en CI)', async () => {
    const res = await auth('post', `/api/v1/quotations/${quotationId}/email`).expect(200);
    expect(res.body.to).toBe('test@kore.dev');
    expect(typeof res.body.delivered).toBe('boolean');
  });

  it('GET /quotations/:id inexistente → 404', async () => {
    await auth('get', '/api/v1/quotations/99999999').expect(404);
  });

  it('no permite ver la cotización de otro usuario → 403', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'other-user@kore.dev',
        password: 'Other1234!',
        firstName: 'Other',
        lastName: 'User',
      })
      .expect(201);
    const otherToken = (res.body as { tokens: { accessToken: string } }).tokens.accessToken;
    await request(app.getHttpServer())
      .get(`/api/v1/quotations/${quotationId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
