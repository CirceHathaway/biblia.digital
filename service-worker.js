// service-worker.js
const CACHE_NAME = 'v41';            // <-- subí la versión
const SCOPE = self.registration.scope; // termina con '/': ej. https://usuario.github.io/tu-repo/

// PRECACHE: poné solo lo que sabés que EXISTE en el repo
const PRECACHE_PATHS = [
  '',                 // raíz del scope (equivale a index.html en GH Pages)
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'favicon.ico',
  'images/background-versiculo.jpg',
  'images/background-versiculo-dia.jpg',
  'js/biblia.js',
  'js/libros.js',
  // agrega aquí estáticos que existan seguro (no pongas miles de libros dinámicos)
];

// Utilidad: resuelve path relativo al scope del SW (funciona en GH Pages)
const urlFromScope = (p) => new URL(p, SCOPE).href;

// -------- Install: precache con logging de errores, sin romper toda la install --------
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const resultados = await Promise.all(PRECACHE_PATHS.map(async (path) => {
      const url = urlFromScope(path);
      try {
        const resp = await fetch(url, { cache: 'reload' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        await cache.put(url, resp.clone());
        return { ok: true, url };
      } catch (err) {
        console.warn('[SW] Precaching failed:', path, '→', err.message || err);
        return { ok: false, url, err };
      }
    }));
    const fails = resultados.filter(r => !r.ok);
    if (fails.length) {
      console.warn(`[SW] Precaching: ${fails.length} archivo(s) omitidos por error 404/Red.`);
    }
  })());
});

// -------- Activate: borra caches viejos --------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.map(n => (n !== CACHE_NAME ? caches.delete(n) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

// -------- Fetch strategies --------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) Navegación: SPA fallback a index.html (scope-relative)
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Intentá red primero
        const net = await fetch(request);
        return net;
      } catch {
        // Offline: devolvé index.html del cache del scope
        const cachedIndex = await caches.match(urlFromScope('index.html'));
        return cachedIndex || Response.error();
      }
    })());
    return;
  }

  // 2) CDNs: Google Fonts, Font Awesome, cdnjs → Stale-While-Revalidate
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
        .then((resp) => {
          if (resp && resp.ok) cache.put(request, resp.clone());
          return resp;
        })
        .catch(() => null); // si falla red, devolvemos lo que haya en cache
      return cached || (await fetchPromise) || Response.error();
    })());
    return;
  }

  // 3) Mis recursos del mismo origen (scope): cache-first con actualización en segundo plano
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((resp) => {
          if (resp && resp.ok) cache.put(request, resp.clone());
          return resp;
        })
        .catch(() => null);
      return cached || (await fetchPromise) || Response.error();
    })());
    return;
  }

  // 4) Otros orígenes: network-first con fallback a cache
  event.respondWith((async () => {
    try {
      const net = await fetch(request);
      return net;
    } catch {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      return cached || Response.error();
    }
  })());
});
