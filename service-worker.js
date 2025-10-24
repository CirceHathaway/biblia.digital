// service-worker.js — FIX offline fallback + CDNs
const VERSION = 'v39';
const CACHE_STATIC  = `biblia-static-${VERSION}`;
const CACHE_RUNTIME = `biblia-runtime-${VERSION}`;

// Path base del sitio (ej: /biblia.digital)
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');

// --- Lista de precache (solo recursos same-origin) ---
const PRECACHE_URLS = [
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/favorito.html`,
  `${BASE_PATH}/contacto.html`,
  `${BASE_PATH}/devocionales.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/css/styles.css`,
  `${BASE_PATH}/js/biblia.js`,
  `${BASE_PATH}/js/appLink.js`,
  `${BASE_PATH}/js/libros.js`,
  `${BASE_PATH}/images/background-versiculo.jpg`,
  `${BASE_PATH}/images/background-versiculo-dia.jpg`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`,
];

// Util
const sameOrigin = (url) => {
  try { return new URL(url).origin === self.location.origin; }
  catch { return false; }
};

// Install: precache limpio (sin no-cors)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: limpia versiones viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_STATIC && k !== CACHE_RUNTIME) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategies:
// - Navegación: network-first con fallback a /biblia.digital/index.html
// - CDNs (Google Fonts / Font Awesome): stale-while-revalidate en runtime
// - Same-origin estáticos: cache-first con write-through
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) Navegaciones (document)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_RUNTIME).then(c => c.put(req, copy));
        return res;
      }).catch(async () => {
        const fallback = await caches.match(`${BASE_PATH}/index.html`);
        return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // 2) CDNs: Google Fonts / Font Awesome
  const isGoogleFonts = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  const isFontAwesome = url.hostname.includes('cdnjs.cloudflare.com');
  if (isGoogleFonts || isFontAwesome) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // 3) Same-origin estáticos
  if (sameOrigin(req.url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 4) Otros: intenta red, y si falla usa caché si existe
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});

// Helpers
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  }).catch(() => undefined);
  return cached || network || new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200) {
      const cache = await caches.open(CACHE_RUNTIME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return cached;
  }
}
