import { useCallback } from 'react';

import { notificationsApi } from '../server/notifications.api';

import type { CreatePushSubscriptionDto } from '@kore/shared';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** Convierte la clave pública VAPID (base64url) al formato que espera `pushManager.subscribe`. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

interface UsePushSubscription {
  supported: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

/**
 * Suscripción Web Push del navegador (ADR-0006). El toggle "push" en
 * `NotificationPreferences` llama a `subscribe`/`unsubscribe` antes de
 * guardar la preferencia, para que el backend siempre tenga una suscripción
 * válida cuando `pushChannel` está activo.
 */
export function usePushSubscription(): UsePushSubscription {
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    Boolean(VAPID_PUBLIC_KEY);

  const subscribe = useCallback(async () => {
    if (!supported || !VAPID_PUBLIC_KEY) {
      throw new Error('Este navegador no soporta notificaciones push.');
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones denegado.');
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      }));
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
      throw new Error('El navegador devolvió una suscripción push incompleta.');
    }
    const payload: CreatePushSubscriptionDto = {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    };
    await notificationsApi.subscribePush(payload);
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await notificationsApi.unsubscribePush(subscription.endpoint);
    await subscription.unsubscribe();
  }, []);

  return { supported, subscribe, unsubscribe };
}
