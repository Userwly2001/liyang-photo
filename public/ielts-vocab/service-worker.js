const CACHE_NAME = 'ielts-vocab-pwa-v6';
const CHAPTER_FILES = Array.from({ length: 22 }, (_, index) => `/ielts-vocab/data-${index + 1}.js`);
const APP_SHELL = [
  '/ielts-vocab/index.html',
  '/ielts-vocab/handout.html',
  '/ielts-vocab/manifest.json',
  '/ielts-vocab/icon.svg',
  ...CHAPTER_FILES,
];

function shouldBypassCache(url) {
  return (
    url.pathname === '/ielts-vocab/index.html' ||
    url.pathname === '/ielts-vocab/handout.html' ||
    url.pathname === '/ielts-vocab/audio-manifest.json' ||
    url.pathname.startsWith('/api/vocab/audio')
  );
}

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

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (shouldBypassCache(url)) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          return new Response('Offline resource unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        })
      )
  );
});
