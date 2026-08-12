import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailChannel } from './channels/email.channel';
import { InAppChannel } from './channels/in-app.channel';
import { PushChannel } from './channels/push.channel';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * US#2 — Notificaciones (arquitectura Postgres, ADR-0002 + push ADR-0006).
 * Módulo autónomo: NO depende de `garage`, para que `garage` pueda
 * importarlo sin ciclos. Exporta el servicio y el despachador que usa el
 * scheduler de recordatorios.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationPreference, PushSubscription])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatcher,
    InAppChannel,
    EmailChannel,
    PushChannel,
  ],
  exports: [NotificationsService, NotificationDispatcher],
})
export class NotificationsModule {}
