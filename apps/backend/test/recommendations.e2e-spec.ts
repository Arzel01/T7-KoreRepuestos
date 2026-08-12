import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e de /recommendations (US#9, acceptance report).
 *
 * Antes de este cambio, GET /recommendations/:id y su ruta
 * /frequently-bought-together devolvían 500 en cualquier llamada real: el
 * ORDER BY usaba el nombre de columna SQL (`p.stock_actual`) donde TypeORM,
 * al combinar `leftJoinAndSelect` + `getMany()` + paginación, exige el
 * nombre de PROPIEDAD de la entidad (`p.stock`). Nunca se detectó porque
 * nada llamaba estos endpoints con cobertura de test — el frontend se
 * limitaba a tragarse el error y no mostrar la sección.
 */
describe('Recommendations (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let categoryA: number;
  let categoryB: number;
  let productSource: number;
  let productSameCategory: number;
  let productOtherCategory: number;
  let productCoPurchased: number;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());

    await dataSource.query(
      'TRUNCATE TABLE detalle_cotizacion, cotizaciones, items_carrito, carrito_compras, productos, categorias, usuarios, sesiones RESTART IDENTITY CASCADE',
    );

    const cats = await dataSource.query<Array<{ id_categoria: number }>>(
      `INSERT INTO categorias (nombre) VALUES ('Frenos AT'), ('Motor AT') RETURNING id_categoria`,
    );
    categoryA = cats[0].id_categoria;
    categoryB = cats[1].id_categoria;

    const products = await dataSource.query<Array<{ id_producto: number }>>(
      `INSERT INTO productos (sku, nombre, precio_base, stock_actual, id_categoria, is_active) VALUES
         ('REC-SRC', 'Producto fuente', 10, 20, $1, TRUE),
         ('REC-SAME-CAT', 'Mismo rubro', 15, 10, $1, TRUE),
         ('REC-OTHER-CAT', 'Otro rubro', 20, 5, $2, TRUE),
         ('REC-COPURCHASE', 'Comprado junto', 25, 8, $2, TRUE)
       RETURNING id_producto`,
      [categoryA, categoryB],
    );
    [productSource, productSameCategory, productOtherCategory, productCoPurchased] = products.map(
      (p) => p.id_producto,
    );

    // Admin (raw insert) + cliente (registro) para generar una cotización real
    // que vincule REC-SRC y REC-COPURCHASE en la misma orden.
    const bcrypt = await import('bcrypt');
    await dataSource.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active)
       VALUES ('rec-admin@test.local', $1, 'Rec Admin', 'Administrador', TRUE)`,
      [await bcrypt.hash('AdminPass1', 4)],
    );
    const clientReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'rec-client@test.local',
        password: 'ClientPass1',
        firstName: 'Rec',
        lastName: 'Client',
      })
      .expect(201);
    const clientToken = clientReg.body.tokens.accessToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productId: productSource, quantity: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productId: productCoPurchased, quantity: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/quotations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ clearCart: false })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /recommendations/:id → 200, prioriza la misma categoría', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/recommendations/${productSource}?limit=3`)
      .expect(200);

    const ids = (res.body as Array<{ id: number }>).map((p) => p.id);
    expect(ids).toContain(productSameCategory);
    expect(ids).toContain(productOtherCategory);
    // El de la misma categoría va antes que el de otra categoría.
    expect(ids.indexOf(productSameCategory)).toBeLessThan(ids.indexOf(productOtherCategory));
  });

  it('GET /recommendations/:id/frequently-bought-together → 200, usa co-compra real', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/recommendations/${productSource}/frequently-bought-together`)
      .expect(200);

    const ids = (res.body as Array<{ id: number }>).map((p) => p.id);
    expect(ids).toContain(productCoPurchased);
  });

  it('frequently-bought-together cae a recomendación por categoría sin historial de compra (cold-start)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/recommendations/${productSameCategory}/frequently-bought-together`)
      .expect(200);

    // REC-SAME-CAT nunca se compró junto a nada — debe caer a category-based
    // y devolver algo de su propia categoría (REC-SRC) en vez de vacío.
    const ids = (res.body as Array<{ id: number }>).map((p) => p.id);
    expect(ids.length).toBeGreaterThan(0);
  });
});
