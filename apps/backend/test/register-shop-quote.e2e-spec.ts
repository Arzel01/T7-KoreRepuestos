import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Integration Testing (Sprint 8) — flujo end-to-end Registro → Compra → Cotización.
 *
 * Ejercita el camino completo de un cliente nuevo a través de los módulos que se
 * integran en el Sprint 8: se registra, ve el catálogo, agrega repuestos al
 * carrito, revisa el resumen (US#21) y genera + descarga la cotización (US#22).
 * Un único usuario recién creado atraviesa todos los pasos con el mismo token.
 */
describe('Register → Shop → Quote (integration e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  const products: number[] = [];

  const EMAIL = `flujo_${'e2e'}@kore.test`;
  const PASSWORD = 'StrongPass1';
  const SKUS = ['E2E-FLOW-A', 'E2E-FLOW-B'];

  beforeAll(async () => {
    app = await createTestingApp();
    ds = app.get<DataSource>(getDataSourceToken());

    // Catálogo determinista: dos repuestos con stock conocido.
    for (const [i, sku] of SKUS.entries()) {
      const rows = (await ds.query(
        `INSERT INTO productos (sku, nombre, precio_base, stock_actual, is_active)
           VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (sku) DO UPDATE SET precio_base = EXCLUDED.precio_base,
                                         stock_actual = EXCLUDED.stock_actual,
                                         is_active = TRUE
         RETURNING id_producto`,
        [sku, `Repuesto Flujo ${sku}`, (i + 1) * 50, 10],
      )) as Array<{ id_producto: number }>;
      products.push(rows[0].id_producto);
    }
  });

  afterAll(async () => {
    await ds.query(
      `DELETE FROM cotizaciones WHERE id_usuario IN (SELECT id_usuario FROM usuarios WHERE email = $1)`,
      [EMAIL],
    );
    await ds.query(`DELETE FROM usuarios WHERE email = $1`, [EMAIL]);
    await ds.query(`DELETE FROM productos WHERE sku = ANY($1)`, [SKUS]);
    await app.close();
  });

  function authed(method: 'get' | 'post', url: string) {
    return request(app.getHttpServer())[method](url).set('Authorization', `Bearer ${token}`);
  }

  it('1) el cliente se registra y recibe un token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: EMAIL, password: PASSWORD, firstName: 'Cliente', lastName: 'Flujo' })
      .expect(201);
    token = res.body.tokens.accessToken as string;
    expect(res.body.user.role).toBe('Cliente');
  });

  it('2) explora el catálogo y encuentra productos disponibles', async () => {
    const res = await authed('get', '/api/v1/products').expect(200);
    // El listado puede venir paginado; basta con que responda una colección.
    const items = Array.isArray(res.body) ? res.body : (res.body.data ?? res.body.items);
    expect(Array.isArray(items)).toBe(true);
  });

  it('3) agrega dos repuestos al carrito', async () => {
    await authed('post', '/api/v1/cart/items')
      .send({ productId: products[0], quantity: 2 })
      .expect(201);
    const res = await authed('post', '/api/v1/cart/items')
      .send({ productId: products[1], quantity: 1 })
      .expect(201);
    expect(res.body.distinctCount).toBe(2);
    expect(res.body.itemCount).toBe(3);
  });

  it('4) revisa el resumen del carrito (US#21)', async () => {
    const res = await authed('get', '/api/v1/cart/summary').expect(200);
    // 2×50 + 1×100 = 200 subtotal; IVA 15% = 30; total 230
    expect(res.body.subtotal).toBe(200);
    expect(res.body.tax).toBe(30);
    expect(res.body.total).toBe(230);
    expect(res.body.canQuote).toBe(true);
  });

  let quotationId: number;
  let quotationNumber: string;

  it('5) genera la cotización a partir del carrito (US#22)', async () => {
    const res = await authed('post', '/api/v1/quotations').send({ sendEmail: true }).expect(201);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(230); // 200 * 1.15
    // Con sendEmail=true el estado pasa a Enviada.
    expect(res.body.status).toBe('Enviada');
    quotationId = res.body.id;
    quotationNumber = res.body.number;
  });

  it('6) descarga el PDF de su cotización', async () => {
    const res = await authed('get', `/api/v1/quotations/${quotationId}/pdf`)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect((res.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
    expect(quotationNumber).toMatch(/^COT-\d{4}-\d{6}$/);
  });

  it('7) el carrito quedó vacío tras cotizar', async () => {
    const res = await authed('get', '/api/v1/cart/summary').expect(200);
    expect(res.body.itemCount).toBe(0);
  });
});
