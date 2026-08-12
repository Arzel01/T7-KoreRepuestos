/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Activa el SW nuevo de inmediato en vez de quedar "waiting" hasta cerrar
// todas las pestañas — sin esto, un rebuild puede dejar el navegador
// sirviendo indefinidamente el bundle anterior (pantalla en blanco tras un
// deploy si los assets viejos ya no existen).
self.skipWaiting();
clientsClaim();

// Inyectado por vite-plugin-pwa (strategy: injectManifest) en build time.
precacheAndRoute(self.__WB_MANIFEST);

interface PushPayload {
  titulo?: string;
  mensaje?: string;
  url?: string;
}

/** Notificación push (recordatorios de mantenimiento, ver ADR-0002). */
self.addEventListener('push', (event: PushEvent) => {
  const data: PushPayload = event.data?.json() ?? {};
  const title = data.titulo ?? 'Kore Repuestos';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.mensaje ?? '',
      icon: '/icons/pwa-192x192.png',
      badge: '/icons/pwa-192x192.png',
      data: { url: data.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
