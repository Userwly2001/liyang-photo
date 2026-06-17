const CACHE_NAME = 'ielts-vocab-pwa-v4';
const CHAPTER_FILES = Array.from({ length: 22 }, (_, index) => `/ielts-vocab/data-${index + 1}.js`);
const APP_SHELL = [
  '/ielts-vocab/index.html',
  '/ielts-vocab/handout.html',
  '/ielts-vocab/manifest.json',
  '/ielts-vocab/icon.svg',
  ...CHAPTER_FILES,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
