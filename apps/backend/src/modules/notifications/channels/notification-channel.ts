import type { NotificationChannel as NotificationChannelName } from '@kore/shared';

/** Mensaje saliente ya materializado, listo para entregar por un canal. */
export interface OutboundNotification {
  /** Destinatario (email) — requerido por el canal `email`, ignorado por `app`. */
  to?: string;
  titulo: string;
  mensaje: string;
}

/**
 * Abstracción de canal de entrega (US#2 · "design notification service
 * architecture"). Cada implementación declara el `canal` que atiende; el
 * despachador enruta cada notificación pendiente al canal correspondiente.
 */
export interface NotificationChannel {
  readonly canal: NotificationChannelName;
  send(msg: OutboundNotification): Promise<void>;
}
