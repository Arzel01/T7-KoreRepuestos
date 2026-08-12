/** Claves de cifrado de una `PushSubscription` del navegador (Push API). */
export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

/**
 * Payload de `PushSubscription.toJSON()` del navegador (Web Push, ADR-0006).
 * Se registra tras `pushManager.subscribe()` para que el backend pueda
 * despachar recordatorios por el canal `push`.
 */
export interface CreatePushSubscriptionDto {
  endpoint: string;
  keys: PushSubscriptionKeys;
}
