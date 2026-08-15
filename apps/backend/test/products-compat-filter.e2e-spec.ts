import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * TC-A-006 + TC-A-007: Filtrado del catálogo por compatibilidad de vehículo.
 *
 * QueryProductsDto acepta vehicleBrand / vehicleModel / vehicleYear.
 * La tabla `compatibilidades` almacena marca/modelo/año_inicio/año_fin.
 *
 * Cubre:
 *   ✓ TC-A-006: ?vehicleBrand + vehicleModel → solo productos compatibles
 *   ✓ TC-A-007: + vehicleYear → filtra por rango de años
 *   ✓ TC-A-007: año fuera de rango excluye el producto
 *   ✓ TC-A-007: limpiar filtros (sin params) retorna todos los activos
 */
describe('ProductsController — filtro por compatibilidad de vehículo (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let adminToken: string;
  let toyotaProductId: number;
  let hondaProductId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    ds = app.get<DataSource>(getDataSourceToken());

    await ds.query(
      'TRUNCATE TABLE sesiones, compatibilidades, productos, categorias, usuarios RESTART IDENTITY CASCADE',
    );

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('AdminPass1', 4);
    await ds.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active)
       VALUES ('admin-compat@test.local', $1, 'Admin Compat', 'Administrador', TRUE)`,
      [hash],
    );
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin-compat@test.local', password: 'AdminPass1' })
      .expect(200);
    adminToken = login.body.tokens.accessToken;

    // Producto A — compatible Toyota Corolla 2018-2023
    const r1 = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'COMPAT-TOY-001', name: 'Filtro Toyota Corolla', price: 30, stock: 5 })
      .expect(201);
    toyotaProductId = r1.body.id as number;

    // Producto B — compatible Honda Civic 2019-2022
    const r2 = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'COMPAT-HON-001', name: 'Filtro Honda Civic', price: 20, stock: 3 })
      .expect(201);
    hondaProductId = r2.body.id as number;

    // Registrar compatibilidades directamente en BD
    await ds.query(
      `INSERT INTO compatibilidades (id_producto, marca, modelo, año_inicio, año_fin)
       VALUES ($1, 'Toyota', 'Corolla', 2018, 2023)`,
      [toyotaProductId],
    );
    await ds.query(
      `INSERT INTO compatibilidades (id_producto, marca, modelo, año_inicio, año_fin)
       VALUES ($1, 'Honda', 'Civic', 2019, 2022)`,
      [hondaProductId],
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (query = ''): request.Test =>
    request(app.getHttpServer()).get(`/api/v1/products${query}`);

  // TC-A-006
  it('?vehicleBrand&vehicleModel → solo productos compatibles con esa combinación (TC-A-006)', async () => {
    const res = await get('?vehicleBrand=Toyota&vehicleModel=Corolla').expect(200);

    const ids = res.body.items.map((p: { id: number }) => p.id);
    expect(ids).toContain(toyotaProductId);
    expect(ids).not.toContain(hondaProductId);
  });

  it('?vehicleBrand distinto retorna los productos de esa marca (TC-A-006)', async () => {
    const res = await get('?vehicleBrand=Honda&vehicleModel=Civic').expect(200);

    const ids = res.body.items.map((p: { id: number }) => p.id);
    expect(ids).toContain(hondaProductId);
    expect(ids).not.toContain(toyotaProductId);
  });

  // TC-A-007
  it('?vehicleYear dentro del rango de compatibilidad incluye el producto (TC-A-007)', async () => {
    const res = await get('?vehicleBrand=Toyota&vehicleModel=Corolla&vehicleYear=2020').expect(200);

    const ids = res.body.items.map((p: { id: number }) => p.id);
    expect(ids).toContain(toyotaProductId);
    expect(ids).not.toContain(hondaProductId);
  });

  it('?vehicleYear fuera del rango de compatibilidad excluye el producto (TC-A-007)', async () => {
    // Toyota Corolla solo está en 2018-2023; año 2015 está fuera del rango
    const res = await get('?vehicleBrand=Toyota&vehicleModel=Corolla&vehicleYear=2015').expect(200);

    const ids = res.body.items.map((p: { id: number }) => p.id);
    expect(ids).not.toContain(toyotaProductId);
  });

  it('sin filtros de compatibilidad (clear filters reset) retorna todos los activos (TC-A-007)', async () => {
    const res = await get().expect(200);

    const ids = res.body.items.map((p: { id: number }) => p.id);
    expect(ids).toContain(toyotaProductId);
    expect(ids).toContain(hondaProductId);
  });
});
