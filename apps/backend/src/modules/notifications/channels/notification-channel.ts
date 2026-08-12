import type { NotificationChannel as NotificationChannelName } from '@kore/shared';

/** Mensaje saliente ya materializado, listo para entregar por un canal. */
export interface OutboundNotification {
  /** Destinatario (email) — requerido por el canal `email`, ignorado por `app`/`push`. */
  to?: string;
  /** Requerido por el canal `push` para resolver las suscripciones del usuario. */
  userId: number;
  titulo: string;
  mensaje: string;
  /** Ruta del frontend a abrir al tocar la notificación (deep link). */
  url?: string;
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
