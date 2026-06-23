import { getDataSourceToken } from '@nestjs/typeorm';
import sharp from 'sharp';
import request from 'supertest';

import { createTestingApp } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Tests e2e para endpoints de imágenes de productos.
 *
 * Criterios de aceptación:
 *   ✓ POST images sin token → 401
 *   ✓ POST images Admin + JPEG válido → 201 con isPrimary=true
 *   ✓ POST images Admin + segunda imagen → 201 con isPrimary=false
 *   ✓ POST images MIME inválido → 400
 *   ✓ POST images magic bytes inválidos (bypass MIME) → 400
 *   ✓ GET images → 200 array público
 *   ✓ DELETE imagen Admin → 204
 *   ✓ DELETE imagen inexistente → 404
 */
describe('ProductsController /api/v1/products/:id/images (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let productId: number;
  let testJpegBuffer: Buffer;

  beforeAll(async () => {
    app = await createTestingApp();
    dataSource = app.get<DataSource>(getDataSourceToken());

    // Genera un JPEG mínimo válido (10x10 px) con magic bytes reales
    testJpegBuffer = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 200, g: 100, b: 50 } },
    })
      .jpeg()
      .toBuffer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE sesiones, fichas_tecnicas, imagenes_producto, logs_auditoria, productos, categorias, usuarios RESTART IDENTITY CASCADE',
    );

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('AdminPass1', 4);
    await dataSource.query(
      `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active)
       VALUES ($1, $2, 'Admin Test', 'Administrador', TRUE)`,
      ['admin@test.local', hash],
    );

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.local', password: 'AdminPass1' })
      .expect(200);
    adminToken = loginRes.body.tokens.accessToken;

    const productRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'IMG-001', name: 'Producto con imágenes', price: 75, stock: 10 })
      .expect(201);
    productId = productRes.body.id as number;
  });

  // ── POST ───────────────────────────────────────────────────────────────────

  it('POST images sin token → 401', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .attach('file', testJpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(401);
  });

  it('POST images Admin + JPEG válido → 201 con isPrimary=true', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testJpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(201);

    expect(res.body).toMatchObject({ productId, isPrimary: true });
    expect(res.body.url).toMatch(/^\/uploads\/.+\.jpg$/);
  });

  it('POST segunda imagen → 201 con isPrimary=false', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testJpegBuffer, { filename: 'first.jpg', contentType: 'image/jpeg' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testJpegBuffer, { filename: 'second.jpg', contentType: 'image/jpeg' })
      .expect(201);

    expect(res.body.isPrimary).toBe(false);
  });

  it('POST images MIME inválido (PDF) → 400', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', pdfBuffer, { filename: 'doc.pdf', contentType: 'application/pdf' })
      .expect(400);
  });

  it('POST images magic bytes inválidos (bypass MIME) → 400', async () => {
    // Contenido de texto disfrazado de JPEG: pasa el fileFilter pero falla la validación de magic bytes
    const fakeBuffer = Buffer.from('este archivo no es una imagen real aunque diga que sí');
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', fakeBuffer, { filename: 'shell.php', contentType: 'image/jpeg' })
      .expect(400);
  });

  it('POST images producto inexistente → 404', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products/9999/images')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testJpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(404);
  });

  // ── GET ────────────────────────────────────────────────────────────────────

  it('GET images → 200 array vacío inicialmente', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/images`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('GET images tras upload → 200 con una imagen', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testJpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/images`)
      .expect(200);
    expect(res.body).toHaveLength(1);
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  it('DELETE imagen Admin → 204 y lista queda vacía', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testJpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(201);

    const imageId = uploadRes.body.id as number;

    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}/images/${imageId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/images`)
      .expect(200);
    expect(listRes.body).toHaveLength(0);
  });

  it('DELETE imagen sin token → 401', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testJpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}/images/${uploadRes.body.id as number}`)
      .expect(401);
  });

  it('DELETE imagen inexistente → 404', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${productId}/images/9999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
