import { Injectable } from '@nestjs/common';

import type { NotificationChannel, OutboundNotification } from './notification-channel';
import type { NotificationChannel as NotificationChannelName } from '@kore/shared';

/**
 * Canal in-app: la notificación ya está persistida en `notificaciones` y el
 * frontend la muestra en el centro de notificaciones. "Entregar" es un no-op;
 * el despachador solo marca la fila como `enviada`.
 */
@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly canal: NotificationChannelName = 'app';

  async send(_msg: OutboundNotification): Promise<void> {
    // Nada que hacer: la fila persistida es la entrega.
  }
}
