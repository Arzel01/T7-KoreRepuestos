import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';

import { PushSubscription } from '../entities/push-subscription.entity';

import type { NotificationChannel, OutboundNotification } from './notification-channel';
import type { NotificationChannel as NotificationChannelName } from '@kore/shared';

/**
 * Canal Web Push (ADR-0006): entrega recordatorios al navegador/dispositivo
 * del usuario aunque la pestaña esté cerrada, vía la Push API estándar +
 * claves VAPID — sin Firebase ni infraestructura adicional (mismo espíritu
 * que ADR-0002). Si faltan `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` (dev/CI sin
 * configurar), degrada a no-op registrando un aviso, igual que `EmailChannel`
 * cae a `jsonTransport` sin `SMTP_HOST`.
 */
@Injectable()
export class PushChannel implements NotificationChannel {
  readonly canal: NotificationChannelName = 'push';
  private readonly logger = new Logger(PushChannel.name);
  private readonly vapidConfigured: boolean;

  constructor(
    config: ConfigService,
    @InjectRepository(PushSubscription)
    private readonly subscriptions: Repository<PushSubscription>,
  ) {
    const publicKey = config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = config.get<string>('VAPID_PRIVATE_KEY');
    const subject = config.get<string>('VAPID_SUBJECT') ?? 'mailto:soporte@kore.dev';

    this.vapidConfigured = Boolean(publicKey && privateKey);
    if (this.vapidConfigured) {
      webpush.setVapidDetails(subject, publicKey!, privateKey!);
    }
  }

  async send(msg: OutboundNotification): Promise<void> {
    if (!this.vapidConfigured) {
      this.logger.debug(`Push simulado (sin VAPID configurado) → usuario ${msg.userId}`);
      return;
    }

    const subs = await this.subscriptions.find({ where: { userId: msg.userId } });
    if (subs.length === 0) {
      throw new Error(`Usuario ${msg.userId} sin suscripciones push`);
    }

    const payload = JSON.stringify({ titulo: msg.titulo, mensaje: msg.mensaje, url: msg.url });
    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        ),
      ),
    );

    const expired: PushSubscription[] = [];
    let delivered = 0;
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        delivered += 1;
        return;
      }
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        expired.push(subs[i]);
      } else {
        this.logger.warn(`Envío push falló (usuario ${msg.userId}): ${result.reason}`);
      }
    });

    if (expired.length > 0) {
      await this.subscriptions.remove(expired);
    }
    if (delivered === 0) {
      throw new Error(
        `No se pudo entregar el push a ninguna suscripción del usuario ${msg.userId}`,
      );
    }
  }
}
