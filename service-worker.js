const CACHE_NAME = 'biblia-digital-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favorito.html',
  '/contacto.html',
  '/css/styles.css',
  '/js/biblia.js',
  '/js/appLink.js',
  '/js/libros.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/images/background-versiculo.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(error => console.error('Error al cachear recursos:', error))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        console.log('Recurso no encontrado en caché ni en la red:', event.request.url);
      })
  );
});

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