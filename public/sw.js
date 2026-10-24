/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Service Worker Offline para Emergencias Viales
 * ARCHIVO: public/sw.js
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Service Worker PWA con estrategia de almacenamiento en caché para situaciones
 * de siniestro vial en zonas con cobertura celular degradada o nula.
 * Permite que los paramédicos o socorristas lean la ficha médica de emergencia
 * previamente consultada aunque el teléfono pierda la señal móvil.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Prioridad absoluta a la lectura offline de datos clínicos.
 * ==============================================================================
 */

const CACHE_NAME = 'safe-incident-cache-v1';

// Recursos críticos para arranque offline
const PRECACHE_RESOURCES = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Evento de instalación: almacenamiento previo de recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_RESOURCES);
    }).then(() => self.skipWaiting())
  );
});

// Evento de activación: limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento de interceptación de peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar peticiones de mutación ni de subida de archivos
  if (request.method !== 'GET') {
    return;
  }

  // Rutas de emergencia y fichas médicas: Estrategia Network-First con fallback a Caché
  if (url.pathname.startsWith('/emergency') || url.pathname.startsWith('/r/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no está en caché directa, intentar responder con la página raíz o de emergencia
          return caches.match('/');
        })
    );
    return;
  }

  // Recursos estáticos e imágenes: Estrategia Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
