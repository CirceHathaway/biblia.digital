const CACHE_NAME = 'biblia-digital-v30'; // Cambiamos el nombre para forzar una nueva instalación
const urlsToCache = [
  '/',
  '/biblia.digital/index.html',
  '/biblia.digital/favorito.html',
  '/biblia.digital/contacto.html',
  '/biblia.digital/css/styles.css',
  '/biblia.digital/js/biblia.js',
  '/biblia.digital/js/appLink.js',
  '/biblia.digital/js/libros.js',
  '/biblia.digital/images/background-versiculo.jpg',
  '/biblia.digital/images/background-versiculo-dia.jpg',
  '/biblia.digital/icons/icon-192x192.png',
  '/biblia.digital/icons/icon-512x512.png',
  '/biblia.digital/manifest.json',
  // Archivos de libros (versículos)
  '/biblia.digital/js/libros/genesis.js',
  '/biblia.digital/js/libros/exodo.js',
  '/biblia.digital/js/libros/levitico.js',
  '/biblia.digital/js/libros/numeros.js',
  '/biblia.digital/js/libros/deuteronomio.js',
  '/biblia.digital/js/libros/josue.js',
  '/biblia.digital/js/libros/jueces.js',
  '/biblia.digital/js/libros/ruth.js',
  '/biblia.digital/js/libros/1_samuel.js',
  '/biblia.digital/js/libros/2_samuel.js',
  '/biblia.digital/js/libros/1_reyes.js',
  '/biblia.digital/js/libros/2_reyes.js',
  '/biblia.digital/js/libros/1_cronicas.js',
  '/biblia.digital/js/libros/2_cronicas.js',
  '/biblia.digital/js/libros/esdras.js',
  '/biblia.digital/js/libros/nehemias.js',
  '/biblia.digital/js/libros/ester.js',
  '/biblia.digital/js/libros/job.js',
  '/biblia.digital/js/libros/salmos.js',
  '/biblia.digital/js/libros/proverbios.js',
  '/biblia.digital/js/libros/eclesiastes.js',
  '/biblia.digital/js/libros/cantares.js',
  '/biblia.digital/js/libros/isaias.js',
  '/biblia.digital/js/libros/jeremias.js',
  '/biblia.digital/js/libros/lamentaciones.js',
  '/biblia.digital/js/libros/ezequiel.js',
  '/biblia.digital/js/libros/daniel.js',
  '/biblia.digital/js/libros/oseas.js',
  '/biblia.digital/js/libros/joel.js',
  '/biblia.digital/js/libros/amos.js',
  '/biblia.digital/js/libros/abdias.js',
  '/biblia.digital/js/libros/jonas.js',
  '/biblia.digital/js/libros/miqueas.js',
  '/biblia.digital/js/libros/nahum.js',
  '/biblia.digital/js/libros/habacuc.js',
  '/biblia.digital/js/libros/sofonias.js',
  '/biblia.digital/js/libros/hageo.js',
  '/biblia.digital/js/libros/zacarias.js',
  '/biblia.digital/js/libros/malaquias.js',
  '/biblia.digital/js/libros/mateo.js',
  '/biblia.digital/js/libros/marcos.js',
  '/biblia.digital/js/libros/lucas.js',
  '/biblia.digital/js/libros/juan.js',
  '/biblia.digital/js/libros/hechos.js',
  '/biblia.digital/js/libros/romanos.js',
  '/biblia.digital/js/libros/1_corintios.js',
  '/biblia.digital/js/libros/2_corintios.js',
  '/biblia.digital/js/libros/galatas.js',
  '/biblia.digital/js/libros/efesios.js',
  '/biblia.digital/js/libros/filipenses.js',
  '/biblia.digital/js/libros/colosenses.js',
  '/biblia.digital/js/libros/1_tesalonicenses.js',
  '/biblia.digital/js/libros/2_tesalonicenses.js',
  '/biblia.digital/js/libros/1_timoteo.js',
  '/biblia.digital/js/libros/2_timoteo.js',
  '/biblia.digital/js/libros/tito.js',
  '/biblia.digital/js/libros/filemon.js',
  '/biblia.digital/js/libros/hebreos.js',
  '/biblia.digital/js/libros/santiago.js',
  '/biblia.digital/js/libros/1_pedro.js',
  '/biblia.digital/js/libros/2_pedro.js',
  '/biblia.digital/js/libros/1_juan.js',
  '/biblia.digital/js/libros/2_juan.js',
  '/biblia.digital/js/libros/3_juan.js',
  '/biblia.digital/js/libros/judas.js',
  '/biblia.digital/js/libros/apocalipsis.js',
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