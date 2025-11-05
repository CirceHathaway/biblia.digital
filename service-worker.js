// service-worker.js
const CACHE_NAME = 'mbiblia-v54';
const SCOPE = self.registration.scope; // p.ej. https://usuario.github.io/biblia.digital/

// Utilidad: resuelve un path relativo al scope del SW
const urlFromScope = (p) => new URL(p, SCOPE).href;

// Precachéa SOLO lo que sabemos que existe y es el "app shell"
const PRECACHE_PATHS = [
  '',                      // raíz (sirve index.html en GH Pages)
  'index.html',
  'css/styles.css',
  'manifest.json',
  'images/background-versiculo.jpg',
  'images/background-versiculo-dia.jpg',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'js/biblia.js',
  'js/versiculosDestacados.js',

  // Índices de versiones para poder listar libros offline
  'js/libros/RVR1960/libros.js',
  'js/libros/RVC/libros.js',
  'js/libros/NVI/libros.js',

  // Páginas adicionales (si las usás)
  'favorito.html',
  'devocionales.html',
  'contacto.html',
  'donaciones.html',
];

// --- INSTALL: precache robusto (sin romper si falta algo) ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE_PATHS.map(async (path) => {
      const url = urlFromScope(path);
      try {
        const resp = await fetch(url, { cache: 'reload' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        await cache.put(url, resp.clone());
      } catch (err) {
        console.warn('[SW] Precaching omitido:', path, String(err && err.message || err));
      }
    }));
  })());
});

// --- ACTIVATE: limpia caches antiguos ---
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => (n !== CACHE_NAME ? caches.delete(n) : null)));
    await self.clients.claim();
    // (Opcional) navigation preload
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
  })());
});

// --- Mensajes desde la app para “precalentar” libros/capítulos ---
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'PRECACHE_BOOKS' && Array.isArray(data.urls) && data.urls.length) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(data.urls.map(async (p) => {
        const url = p.startsWith('http') ? p : urlFromScope(p);
        try {
          const resp = await fetch(url, { cache: 'reload' });
          if (resp.ok) await cache.put(url, resp.clone());
        } catch (e) {
          console.warn('[SW] No se pudo precachear', p);
        }
      }));
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ ok: true, cached: data.urls.length });
      }
    })());
  }
});

// --- FETCH: estrategias por tipo ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) Navegación → try network, fallback a app-shell
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = (self.registration.navigationPreload)
          ? await event.preloadResponse
          : null;
        return preload || await fetch(request);
      } catch {
        const cachedIndex = await caches.match(urlFromScope('index.html'));
        return cachedIndex || Response.error();
      }
    })());
    return;
  }

  // 2) CDNs comunes (Google Fonts, cdnjs, jsdelivr, unpkg) → stale-while-revalidate
  const isCDN =
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('unpkg.com');

  if (isCDN) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((resp) => { if (resp && resp.ok) cache.put(request, resp.clone()); return resp; })
        .catch(() => null);
      return cached || (await fetchPromise) || Response.error();
    })());
    return;
  }

  // 3) Mismo origen (incluye módulos import() de /js/libros/...) → cache-first con actualización en bg
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((resp) => { if (resp && resp.ok) cache.put(request, resp.clone()); return resp; })
        .catch(() => null);
      return cached || (await fetchPromise) || Response.error();
    })());
    return;
  }

  // 4) Otros orígenes → network-first + fallback a cache
  event.respondWith((async () => {
    try { return await fetch(request); }
    catch {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      return cached || Response.error();
    }
  })());
});