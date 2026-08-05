import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailChannel } from './channels/email.channel';
import { InAppChannel } from './channels/in-app.channel';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Notification } from './entities/notification.entity';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * US#2 — Notificaciones (arquitectura Postgres, ADR-0002). Módulo autónomo:
 * NO depende de `garage`, para que `garage` pueda importarlo sin ciclos.
 * Exporta el servicio y el despachador que usa el scheduler de recordatorios.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationPreference])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationDispatcher, InAppChannel, EmailChannel],
  exports: [NotificationsService, NotificationDispatcher],
})
export class NotificationsModule {}
