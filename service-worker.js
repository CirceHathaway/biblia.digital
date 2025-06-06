const CACHE_NAME = 'biblia-digital-v2'; // Cambiamos el nombre para forzar una nueva instalación
const urlsToCache = [
  '/',
  '/index.html',
  '/favorito.html',
  '/contacto.html',
  '/css/styles.css',
  '/js/biblia.js',
  '/js/appLink.js',
  '/js/libros.js',
  '/images/background-versiculo.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
  // Archivos de libros (versículos)
  '/js/libros/genesis.js',
  '/js/libros/exodo.js',
  '/js/libros/levitico.js',
  '/js/libros/numeros.js',
  '/js/libros/deuteronomio.js',
  '/js/libros/josue.js',
  '/js/libros/jueces.js',
  '/js/libros/rut.js',
  '/js/libros/1_samuel.js',
  '/js/libros/2_samuel.js',
  '/js/libros/1_reyes.js',
  '/js/libros/2_reyes.js',
  '/js/libros/1_cronicas.js',
  '/js/libros/2_cronicas.js',
  '/js/libros/esdras.js',
  '/js/libros/nehemias.js',
  '/js/libros/ester.js',
  '/js/libros/job.js',
  '/js/libros/salmos.js',
  '/js/libros/proverbios.js',
  '/js/libros/eclesiastes.js',
  '/js/libros/cantares.js',
  '/js/libros/isaias.js',
  '/js/libros/jeremias.js',
  '/js/libros/lamentaciones.js',
  '/js/libros/ezequiel.js',
  '/js/libros/daniel.js',
  '/js/libros/oseas.js',
  '/js/libros/joel.js',
  '/js/libros/amos.js',
  '/js/libros/abdias.js',
  '/js/libros/jonas.js',
  '/js/libros/miqueas.js',
  '/js/libros/nahum.js',
  '/js/libros/habacuc.js',
  '/js/libros/sofonias.js',
  '/js/libros/hageo.js',
  '/js/libros/zacarias.js',
  '/js/libros/malaquias.js',
  '/js/libros/mateo.js',
  '/js/libros/marcos.js',
  '/js/libros/lucas.js',
  '/js/libros/juan.js',
  '/js/libros/hechos.js',
  '/js/libros/romanos.js',
  '/js/libros/1corintios.js',
  '/js/libros/2corintios.js',
  '/js/libros/galatas.js',
  '/js/libros/efesios.js',
  '/js/libros/filipenses.js',
  '/js/libros/colosenses.js',
  '/js/libros/1_tesalonicenses.js',
  '/js/libros/2_tesalonicenses.js',
  '/js/libros/1_timoteo.js',
  '/js/libros/2_timoteo.js',
  '/js/libros/tito.js',
  '/js/libros/filemon.js',
  '/js/libros/hebreos.js',
  '/js/libros/santiago.js',
  '/js/libros/1_pedro.js',
  '/js/libros/2_pedro.js',
  '/js/libros/1_juan.js',
  '/js/libros/2_juan.js',
  '/js/libros/3_juan.js',
  '/js/libros/judas.js',
  '/js/libros/apocalipsis.js',
  // Recursos externos (cacheados para offline)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap',
];

// Instalación: Cachear todos los recursos necesarios
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        // Cacheamos cada recurso individualmente para identificar cuál falla
        const cachePromises = urlsToCache.map(url => {
          return fetch(url, { mode: 'no-cors' }) // Usamos no-cors para evitar problemas con recursos externos
            .then(response => {
              if (!response.ok) {
                console.warn(`No se pudo cachear ${url}: ${response.status} ${response.statusText}`);
                return null; // Devolvemos null para recursos que fallan
              }
              return cache.put(url, response);
            })
            .catch(error => {
              console.error(`Error al intentar cachear ${url}:`, error);
              return null;
            });
        });
        return Promise.all(cachePromises).then(() => {
          console.log('Cacheo completado');
        });
      })
      .catch(error => {
        console.error('Error al abrir el caché:', error);
      })
  );
  self.skipWaiting();
});

// Activación: Limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Servir recursos desde el caché si estamos offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en caché, devolverlo
        if (response) {
          return response;
        }
        // Si no está en caché, intentar obtenerlo de la red
        return fetch(event.request).then(networkResponse => {
          // Si la solicitud es exitosa, cachear el recurso
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Si estamos offline y no está en caché, devolver un fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});