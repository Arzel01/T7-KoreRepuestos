import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e de las mejoras de búsqueda entregadas este sprint sobre Postgres
 * FTS (ver ADR-0001): sinónimos del dominio (pastillas↔balatas) y resaltado
 * con ts_headline. Siembra un producto conocido y lo limpia al final.
 */
describe('Products Search — synonyms & highlight (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let productId: number;

  const SKU = 'E2E-SYN-PAST-001';
  const NAME = 'Pastillas de freno delanteras';

  beforeAll(async () => {
    app = await createTestingApp();
    ds = app.get<DataSource>(getDataSourceToken());

    // Sinónimo pastillas↔balatas viene sembrado por la migración AddSinonimos.
    const rows = await ds.query<Array<{ id_producto: number }>>(
      `INSERT INTO public.productos (sku, nombre, descripcion, precio_base, stock_actual, is_active)
       VALUES ($1, $2, 'Juego de pastillas para frenos de disco', 25.90, 10, TRUE)
       ON CONFLICT (sku) DO UPDATE SET nombre = EXCLUDED.nombre, is_active = TRUE
       RETURNING id_producto`,
      [SKU, NAME],
    );
    productId = rows[0].id_producto;
  });

  afterAll(async () => {
    if (productId) {
      await ds.query(`DELETE FROM public.productos WHERE id_producto = $1`, [productId]);
    }
    await app.close();
  });

  it('busca "balatas" y encuentra el producto llamado "Pastillas…" (sinónimo)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ search: 'balatas' })
      .expect(200);

    const body = res.body as { items: Array<{ id: number; name: string }>; total: number };
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.items.some((i) => /pastilla/i.test(i.name))).toBe(true);
  });

  it('resalta el término buscado con <mark> (ts_headline)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ search: 'pastillas' })
      .expect(200);

    const body = res.body as { items: Array<{ id: number; highlight?: string }> };
    const match = body.items.find((i) => i.id === productId);
    expect(match).toBeDefined();
    expect(match?.highlight).toContain('<mark>');
  });

  it('sin búsqueda no incluye highlight', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ pageSize: 1 })
      .expect(200);

    const body = res.body as { items: Array<{ highlight?: string }> };
    if (body.items.length) {
      expect(body.items[0].highlight).toBeUndefined();
    }
  });

  it('autocomplete de "balatas" sugiere el producto "Pastillas…" (sinónimo)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products/suggestions')
      .query({ q: 'balatas' })
      .expect(200);

    const body = res.body as Array<{ name: string }>;
    expect(body.some((s) => /pastilla/i.test(s.name))).toBe(true);
  });
});
