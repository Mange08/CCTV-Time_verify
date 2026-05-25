// CCTV-Time Catch — Service Worker v0.11
const CACHE = 'cctv-timecatch-v0.11';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './maskable-192.png',
  './maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  const isTimeSource =
    url.hostname.includes('cloudflare.com') ||
    url.hostname.includes('worldtimeapi.org') ||
    url.hostname.includes('timeapi.io') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('apple.com');

  if (isTimeSource) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('tessdata')) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const res = await fetch(e.request);
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        } catch (err) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
