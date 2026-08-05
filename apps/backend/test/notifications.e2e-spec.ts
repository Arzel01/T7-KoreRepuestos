import { getDataSourceToken } from '@nestjs/typeorm';

import { EmailChannel } from '../src/modules/notifications/channels/email.channel';
import { NotificationDispatcher } from '../src/modules/notifications/notification-dispatcher.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

import { createTestingApp, seedTestUsers } from './setup-e2e';

import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';

/**
 * Integración del outbox de notificaciones (US#2 · JA). Ejercita el ciclo
 * encolar → despachar → estado, y el canal email vía `jsonTransport` (sin red).
 * No requiere Redis ni SMTP.
 */
describe('Notifications outbox (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let notifications: NotificationsService;
  let dispatcher: NotificationDispatcher;
  let userId: number;

  beforeAll(async () => {
    app = await createTestingApp();
    await seedTestUsers(app);
    ds = app.get<DataSource>(getDataSourceToken());
    notifications = app.get(NotificationsService);
    dispatcher = app.get(NotificationDispatcher);
    const rows: Array<{ id_usuario: number }> = await ds.query(
      "SELECT id_usuario FROM usuarios WHERE email = 'test@kore.dev' LIMIT 1",
    );
    userId = rows[0].id_usuario;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await ds.query('TRUNCATE TABLE notificaciones RESTART IDENTITY CASCADE');
  });

  it('el canal email usa jsonTransport (sin SMTP) en el entorno de test', () => {
    const email = app.get(EmailChannel);
    expect(email.usesRealSmtp).toBe(false);
  });

  it('despacha una notificación in-app pendiente y la marca enviada', async () => {
    const created = await notifications.enqueue({
      userId,
      canal: 'app',
      titulo: 'Hola',
      mensaje: 'Mensaje',
    });
    expect(created).not.toBeNull();

    const sent = await dispatcher.flush();
    expect(sent).toBe(1);

    const [row] = await ds.query(
      'SELECT estado, enviada_en FROM notificaciones WHERE id_notificacion = $1',
      [created!.id],
    );
    expect(row.estado).toBe('enviada');
    expect(row.enviada_en).not.toBeNull();
  });

  it('despacha una notificación email componiendo el mensaje (jsonTransport)', async () => {
    await notifications.enqueue({
      userId,
      canal: 'email',
      titulo: 'Recordatorio',
      mensaje: 'Tu servicio vence pronto',
    });
    const sent = await dispatcher.flush();
    expect(sent).toBe(1);

    const [row] = await ds.query("SELECT estado FROM notificaciones WHERE canal = 'email'");
    expect(row.estado).toBe('enviada');
  });

  it('no despacha notificaciones programadas para el futuro', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await notifications.enqueue({
      userId,
      canal: 'app',
      titulo: 'Futuro',
      mensaje: 'Aún no',
      scheduledFor: future,
    });
    const sent = await dispatcher.flush(new Date());
    expect(sent).toBe(0);

    const [row] = await ds.query("SELECT estado FROM notificaciones WHERE titulo = 'Futuro'");
    expect(row.estado).toBe('pendiente');
  });

  it('lista in-app, cuenta no leídas y marca como leída', async () => {
    const created = await notifications.enqueue({
      userId,
      canal: 'app',
      titulo: 'Léeme',
      mensaje: 'x',
    });

    expect(await notifications.unreadCount(userId)).toBe(1);

    const list = await notifications.listForUser(userId);
    expect(list).toHaveLength(1);

    await notifications.markRead(userId, created!.id);
    expect(await notifications.unreadCount(userId)).toBe(0);

    const [row] = await ds.query(
      'SELECT estado, leida_en FROM notificaciones WHERE id_notificacion = $1',
      [created!.id],
    );
    expect(row.estado).toBe('leida');
    expect(row.leida_en).not.toBeNull();
  });
});
