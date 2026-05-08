/* Service worker for OneStopSGTaxi push notifications.
 * Minimal — handles `push` events and `notificationclick`.
 * Does not yet cache the app (offline shell is V1.1).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'OneStopSGTaxi', body: event.data.text() };
  }
  const title = payload.title || 'OneStopSGTaxi';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192',
    badge: payload.badge || '/icon-192',
    data: payload.data || {},
    tag: payload.tag,
    renotify: !!payload.renotify,
    requireInteraction: !!payload.requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.endsWith(url)) return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return null;
    }),
  );
});
