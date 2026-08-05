import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';

import { createTestingApp, seedTestUsers } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e de búsquedas guardadas (US#12): CRUD, autenticación y aislamiento
 * entre usuarios (A no ve ni borra las de B).
 */
describe('Saved Searches (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let tokenA: string;
  let tokenB: string;
  let savedId: number;

  const NOMBRE = 'E2E Pastillas Corolla';

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { tokens: { accessToken: string } }).tokens.accessToken;
  }

  beforeAll(async () => {
    app = await createTestingApp();
    ds = app.get<DataSource>(getDataSourceToken());
    await seedTestUsers(app);
    // Limpia restos de corridas previas (DB local persistente).
    await ds.query(`DELETE FROM public.busquedas_guardadas WHERE nombre = $1`, [NOMBRE]);
    tokenA = await login('test@kore.dev', 'Test1234!');
    tokenB = await login('admin@kore.dev', 'Admin1234!');
  });

  afterAll(async () => {
    await ds.query(`DELETE FROM public.busquedas_guardadas WHERE nombre = $1`, [NOMBRE]);
    await app.close();
  });

  it('GET /searches sin token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/searches').expect(401);
  });

  it('POST /searches (A) → 201 con id', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/searches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nombre: NOMBRE, parametros: { search: 'pastillas', vehicleBrand: 'Toyota' } })
      .expect(201);

    const body = res.body as { id: number; nombre: string; parametros: { search: string } };
    savedId = body.id;
    expect(savedId).toBeGreaterThan(0);
    expect(body.nombre).toBe(NOMBRE);
    expect(body.parametros.search).toBe('pastillas');
  });

  it('POST /searches (A) mismo nombre → 409', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/searches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nombre: NOMBRE, parametros: { search: 'otro' } })
      .expect(409);
  });

  it('GET /searches (A) → incluye la guardada', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/searches')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const body = res.body as Array<{ id: number }>;
    expect(body.some((s) => s.id === savedId)).toBe(true);
  });

  it('GET /searches (B) → NO ve la de A (aislamiento)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/searches')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const body = res.body as Array<{ id: number }>;
    expect(body.some((s) => s.id === savedId)).toBe(false);
  });

  it('DELETE /searches/:id (B) → 404 (no es dueño)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/searches/${savedId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('DELETE /searches/:id (A) → 204', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/searches/${savedId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);
  });
});
