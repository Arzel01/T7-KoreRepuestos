import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { EmailChannel } from './channels/email.channel';
import { InAppChannel } from './channels/in-app.channel';
import { PushChannel } from './channels/push.channel';
import { NotificationsService } from './notifications.service';

import type { NotificationChannel } from './channels/notification-channel';

/**
 * Despachador del outbox (ADR-0002). Toma las notificaciones `pendiente`
 * vencidas y las entrega por su canal, marcándolas `enviada`/`fallida`.
 * Reemplaza a Bull/Agenda: la "cola" es la propia tabla `notificaciones`.
 *
 * Nota: despliegue single-instance. Para multi-instancia se añadiría un claim
 * con `FOR UPDATE SKIP LOCKED` (ver triggers de reevaluación en ADR-0002).
 */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private readonly channels: Record<string, NotificationChannel>;

  constructor(
    private readonly notifications: NotificationsService,
    inApp: InAppChannel,
    email: EmailChannel,
    push: PushChannel,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.channels = { [inApp.canal]: inApp, [email.canal]: email, [push.canal]: push };
  }

  /** Procesa las notificaciones pendientes vencidas. Devuelve cuántas envió. */
  async flush(now: Date = new Date()): Promise<number> {
    const pending = await this.notifications.findDuePending(now);
    let sent = 0;

    for (const n of pending) {
      const channel = this.channels[n.canal];
      try {
        if (!channel) throw new Error(`Canal desconocido: ${n.canal}`);
        const to = n.canal === 'email' ? await this.resolveEmail(n.userId) : undefined;
        const url = n.vehicleId ? '/garage' : undefined;
        await channel.send({ to, userId: n.userId, titulo: n.titulo, mensaje: n.mensaje, url });
        n.estado = 'enviada';
        n.sentAt = now;
        sent += 1;
      } catch (err) {
        n.estado = 'fallida';
        this.logger.warn(
          `No se pudo enviar la notificación ${n.id} (${n.canal}): ${(err as Error).message}`,
        );
      }
      await this.notifications.save(n);
    }

    return sent;
  }

  private async resolveEmail(userId: number): Promise<string> {
    const rows: Array<{ email: string }> = await this.dataSource.query(
      'SELECT email FROM usuarios WHERE id_usuario = $1 LIMIT 1',
      [userId],
    );
    const email = rows[0]?.email;
    if (!email) throw new Error(`Usuario ${userId} sin email`);
    return email;
  }
}
