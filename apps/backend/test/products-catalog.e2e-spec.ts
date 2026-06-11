import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e del catálogo público GET /api/v1/products.
 *
 * Cubre el contrato paginado y todos los filtros:
 *   ✓ Shape PaginatedResult + exclusión de inactivos + price numérico
 *   ✓ categoryIds (simple y separado por comas)
 *   ✓ Rango de precios (minPrice / maxPrice)
 *   ✓ inStock=true y, crítico, inStock=false (guard de regresión del bug
 *     de enableImplicitConversion que convierte 'false' en true)
 *   ✓ Búsqueda por substring y con typo (pg_trgm)
 *   ✓ Paginación y ordenamiento
 *   ✓ 400s de validación
 */
describe('ProductsController GET /api/v1/products — catálogo (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let frenosId: string;
  let filtrosId: string;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE sessions, products, product_categories, users RESTART IDENTITY CASCADE',
    );

    const cats: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO product_categories (name, slug)
       VALUES ('Frenos', 'frenos'), ('Filtros', 'filtros')
       RETURNING id`,
    );
    [frenosId, filtrosId] = [cats[0].id, cats[1].id];

    // 5 productos activos (uno sin stock) + 1 inactivo.
    await dataSource.query(
      `INSERT INTO products (sku, name, category_id, price, stock, is_active) VALUES
       ('FIL-001', 'Filtro de aceite',   $2, 10.00,  45, TRUE),
       ('FIL-002', 'Filtro de aire',     $2, 50.00,  10, TRUE),
       ('FRE-001', 'Pastilla de freno',  $1, 200.00,  5, TRUE),
       ('FRE-002', 'Disco de freno',     $1, 120.00,  0, TRUE),
       ('BUJ-001', 'Bujía estándar',   NULL, 15.00,  99, TRUE),
       ('INA-001', 'Producto inactivo', NULL, 30.00,  3, FALSE)`,
      [frenosId, filtrosId],
    );
  });

  const get = (query = ''): request.Test =>
    request(app.getHttpServer()).get(`/api/v1/products${query}`);

  // ---------------------------------------------------------------------------
  // Contrato base
  // ---------------------------------------------------------------------------
  it('devuelve el shape paginado por defecto excluyendo inactivos', async () => {
    const res = await get().expect(200);

    expect(res.body).toMatchObject({
      total: 5,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });
    expect(res.body.items).toHaveLength(5);
    const skus = res.body.items.map((p: { sku: string }) => p.sku);
    expect(skus).not.toContain('INA-001');
    // Guard de regresión: el transformer de la entidad debe convertir
    // numeric(12,2) (string en pg) a number en JSON.
    expect(typeof res.body.items[0].price).toBe('number');
  });

  // ---------------------------------------------------------------------------
  // Filtros
  // ---------------------------------------------------------------------------
  it('filtra por una categoría', async () => {
    const res = await get(`?categoryIds=${frenosId}`).expect(200);
    expect(res.body.total).toBe(2);
    const names = res.body.items.map((p: { name: string }) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Pastilla de freno', 'Disco de freno']));
  });

  it('filtra por varias categorías separadas por comas', async () => {
    const res = await get(`?categoryIds=${frenosId},${filtrosId}`).expect(200);
    expect(res.body.total).toBe(4); // 2 frenos + 2 filtros, la bujía sin categoría queda fuera
  });

  it('filtra por rango de precios', async () => {
    const res = await get('?minPrice=20&maxPrice=100').expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].sku).toBe('FIL-002'); // 50.00
  });

  it('inStock=true excluye productos agotados', async () => {
    const res = await get('?inStock=true').expect(200);
    expect(res.body.total).toBe(4);
    const skus = res.body.items.map((p: { sku: string }) => p.sku);
    expect(skus).not.toContain('FRE-002');
  });

  it('inStock=false NO filtra (regresión: implicit conversion de "false")', async () => {
    const res = await get('?inStock=false').expect(200);
    expect(res.body.total).toBe(5); // incluye el agotado FRE-002
  });

  it('combina filtros (categoría + inStock)', async () => {
    const res = await get(`?categoryIds=${frenosId}&inStock=true`).expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].sku).toBe('FRE-001');
  });

  // ---------------------------------------------------------------------------
  // Búsqueda
  // ---------------------------------------------------------------------------
  it('busca por substring (ILIKE cubre términos cortos)', async () => {
    const res = await get('?search=filtro').expect(200);
    expect(res.body.total).toBe(2);
  });

  it('busca con typo gracias a pg_trgm', async () => {
    const res = await get('?search=flitro%20de%20aceite').expect(200);
    const names = res.body.items.map((p: { name: string }) => p.name);
    expect(names).toContain('Filtro de aceite');
  });

  it('busca con typo CORTO contra nombre largo (word_similarity)', async () => {
    // similarity() de string completo daría ~0.1 y fallaría; word_similarity
    // compara contra la palabra más parecida del nombre (~0.29 ≥ 0.25).
    const res = await get('?search=flitro').expect(200);
    const names = res.body.items.map((p: { name: string }) => p.name);
    expect(names).toContain('Filtro de aceite');
  });

  it('busca por SKU', async () => {
    const res = await get('?search=BUJ-001').expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe('Bujía estándar');
  });

  // ---------------------------------------------------------------------------
  // Paginación y ordenamiento
  // ---------------------------------------------------------------------------
  it('pagina correctamente', async () => {
    const res = await get('?pageSize=2&page=2&sortBy=name&sortOrder=asc').expect(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body).toMatchObject({ total: 5, page: 2, pageSize: 2, totalPages: 3 });
  });

  it('página fuera de rango devuelve items vacíos con el mismo total', async () => {
    const res = await get('?page=99').expect(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.total).toBe(5);
  });

  it('ordena por precio ascendente', async () => {
    const res = await get('?sortBy=price&sortOrder=asc').expect(200);
    const prices = res.body.items.map((p: { price: number }) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices[0]).toBe(10);
  });

  // ---------------------------------------------------------------------------
  // Validación
  // ---------------------------------------------------------------------------
  it('rechaza categoryIds que no son UUID (400)', async () => {
    await get('?categoryIds=not-a-uuid').expect(400);
  });

  it('rechaza minPrice no numérico (400)', async () => {
    await get('?minPrice=abc').expect(400);
  });

  it('rechaza pageSize fuera de rango (400)', async () => {
    await get('?pageSize=999').expect(400);
    await get('?page=0').expect(400);
  });

  it('rechaza sortBy no permitido (400)', async () => {
    await get('?sortBy=password_hash').expect(400);
  });

  it('rechaza query params desconocidos (400, forbidNonWhitelisted)', async () => {
    await get('?foo=1').expect(400);
  });
});
