import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';

describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    app = await createTestingApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (res.body as { accessToken: string }).accessToken;
  }

  it('GET /analytics/searches sin token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/analytics/searches').expect(401);
  });

  describe('con usuario cliente', () => {
    beforeAll(async () => {
      clientToken = await login(
        process.env.TEST_USER_EMAIL ?? 'test@kore.dev',
        process.env.TEST_USER_PASS ?? 'Test1234!',
      );
    });

    it('GET /analytics/searches como cliente → 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/analytics/searches')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('con usuario admin', () => {
    beforeAll(async () => {
      adminToken = await login(
        process.env.TEST_ADMIN_EMAIL ?? 'admin@kore.dev',
        process.env.TEST_ADMIN_PASS ?? 'Admin1234!',
      );
    });

    it('GET /analytics/searches como admin → 200 con topTerms y zeroResultTerms', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/searches')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { topTerms: unknown[]; zeroResultTerms: unknown[] };
      expect(Array.isArray(body.topTerms)).toBe(true);
      expect(Array.isArray(body.zeroResultTerms)).toBe(true);
    });

    it('GET /analytics/searches?days=7&limit=5 → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/searches')
        .query({ days: 7, limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('topTerms');
    });
  });
});
