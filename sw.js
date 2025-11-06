// ====================================
// Service Worker - PWA Cámara
// Estrategia: Cache First
// ====================================

const CACHE_NAME = 'pwa-camara-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/assets/192.png',
  '/assets/512.png'
];

/**
 * Evento INSTALL
 * Se ejecuta cuando el Service Worker se instala por primera vez
 * Cachea todos los recursos estáticos necesarios
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cacheando archivos');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalación completa');
        // Forzar que el nuevo SW tome control inmediatamente
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Error en instalación:', error);
      })
  );
});

/**
 * Evento ACTIVATE
 * Se ejecuta cuando el Service Worker se activa
 * Limpia cachés antiguos
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar cachés antiguos que no coincidan con el nombre actual
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Eliminando caché antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activación completa');
        // Tomar control de todas las páginas inmediatamente
        return self.clients.claim();
      })
  );
});

/**
 * Evento FETCH
 * Intercepta todas las peticiones de red
 * Implementa estrategia Cache First (con fallback a red)
 */
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o que sean del protocolo chrome-extension
  if (event.request.method !== 'GET' || event.request.url.includes('chrome-extension')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si hay respuesta en caché, devolverla
        if (cachedResponse) {
          console.log('✅ Sirviendo desde caché:', event.request.url);
          return cachedResponse;
        }
        
        // Si no hay caché, hacer petición a la red
        console.log('🌐 Obteniendo de la red:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Verificar si la respuesta es válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clonar la respuesta porque es un stream que solo se puede consumir una vez
            const responseToCache = networkResponse.clone();
            
            // Guardar en caché para futuras peticiones
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('💾 Guardado en caché:', event.request.url);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('❌ Error en fetch:', error);
            
            // Opcional: Retornar una página de error personalizada
            // return caches.match('/offline.html');
            
            throw error;
          });
      })
  );
});

/**
 * Evento MESSAGE
 * Permite comunicación entre la página y el Service Worker
 */
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: Mensaje recibido:', event.data);
  
  // Ejemplo: Responder con información del caché
  if (event.data.action === 'getCacheInfo') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({
          cacheName: CACHE_NAME,
          cachedItems: keys.length
        });
      });
    });
  }
  
  // Ejemplo: Limpiar caché manualmente
  if (event.data.action === 'clearCache') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('✨ Service Worker cargado');
