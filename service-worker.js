a// service-worker.js
const CACHE_NAME = 'biblia-app-v1';
const urlsToCache = [
  './index.html',
  './css/styles.css',
  './js/biblia.js',
  './js/libros.js'
];

// Instalación del Service Worker y cacheo de recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar el Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Interceptar solicitudes de red y servir desde el caché
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});