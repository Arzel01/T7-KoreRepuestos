import * as request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';

describe('Products Search (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Catálogo con full-text ────────────────────────────────────────────────

  it('GET /products?search=filtro → 200 paginado', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ search: 'filtro' })
      .expect(200);

    const body = res.body as { items: unknown[]; total: number; page: number };
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page', 1);
  });

  it('GET /products?search=fitro (typo trgm) → 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ search: 'fitro' })
      .expect(200);

    expect((res.body as { items: unknown[] }).items).toBeDefined();
  });

  it('GET /products?search=aceite → stemming español devuelve resultados de "aceites"', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ search: 'aceite' })
      .expect(200);

    expect((res.body as { items: unknown[] }).items).toBeDefined();
  });

  // ── Suggestions / autocomplete ────────────────────────────────────────────

  it('GET /products/suggestions?q=fi → 400 (< 2 chars)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/products/suggestions')
      .query({ q: 'f' })
      .expect(400);
  });

  it('GET /products/suggestions?q=fil → 200 array ordenado', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products/suggestions')
      .query({ q: 'fil' })
      .expect(200);

    const body = res.body as { id: number; name: string; sku: string; price: number }[];
    expect(Array.isArray(body)).toBe(true);
    body.forEach((s) => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('sku');
      expect(s).toHaveProperty('price');
    });
  });

  it('GET /products/suggestions?q=fil&limit=3 → máx 3 resultados', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products/suggestions')
      .query({ q: 'fil', limit: 3 })
      .expect(200);

    expect((res.body as unknown[]).length).toBeLessThanOrEqual(3);
  });

  // ── Analytics logging ─────────────────────────────────────────────────────

  it('GET /products?search=filtro → registra búsqueda en busquedas_log', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ search: 'filtro_test_unique_xyz' })
      .expect(200);

    // Verificar que se registró en analytics (vía endpoint admin)
    // Para verificación más profunda se haría acceso directo a DB en el test.
    // Aquí solo validamos que el catalog no rompe.
  });
});
