const CACHE = 'plan-cine-v2';
const PRECACHE = ['/', '/login', '/register', '/logo.png', '/icon-192.png', '/icon-512.png', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});

// ─── Push Notifications ──────────────────────────────────────────────────────

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data?.json() ?? {}; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Plan Cine', {
      body: data.body ?? '',
      icon: data.icon ?? '/icon-192.png',
      badge: data.badge ?? '/icon-192.png',
      data: { url: data.url ?? '/' },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data?.url ?? '/';

  // Resolve to absolute URL so navigate() works whether app is open or not
  const absolute = target.startsWith('http') ? target : self.location.origin + target;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Try to reuse an existing window that matches the target URL or any open window
      for (const client of list) {
        if (client.url === absolute && 'focus' in client) {
          return client.focus();
        }
      }
      // Navigate first open window, or open a new one
      for (const client of list) {
        if ('navigate' in client && 'focus' in client) {
          return client.navigate(absolute).then(() => client.focus());
        }
      }
      if (clients.openWindow) return clients.openWindow(absolute);
    })
  );
});
