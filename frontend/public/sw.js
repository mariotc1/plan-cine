const CACHE = 'plan-cine-v3';
// HTML routes are deliberately NOT in this list — see the fetch handler below.
// A cached login/home page would keep referencing JS chunks from whatever build
// was live when it was cached, which 404 against a newer deploy and freeze the
// app on an infinite load until the user manually clears site data.
const PRECACHE = ['/logo.png', '/icon-192.png', '/icon-512.png', '/manifest.json'];

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

  const url = new URL(e.request.url);

  // Only ever serve from cache the handful of static assets explicitly listed in
  // PRECACHE (icons, logo, manifest — small, rarely-changing, not content-hashed).
  // Everything else — HTML navigations, hashed /_next/static chunks, the API —
  // always goes straight to the network. This SW's job is installability and push
  // notifications, not an offline app-shell cache; a stale cached page must never
  // be able to trap a user on an old build.
  if (url.origin !== self.location.origin || !PRECACHE.includes(url.pathname)) return;

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
