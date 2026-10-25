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
 * CORRECCIÓN C-17 (CRITICAL — PII EN CACHE STORAGE): la rama Stale-While-Revalidate
 * cacheaba TODO GET 200, incluyendo datos sensibles: /api/profile (ficha médica
 * completa y cédula), /api/auth/session (sesión rancia tras logout) y
 * /api/admin/batches?includePins=true (PINs de activación en texto plano).
 * Ahora esas rutas NUNCA se interceptan ni se persisten en disco, y toda
 * respuesta con `Cache-Control: no-store` del servidor se respeta sin cachear
 * (cumplimiento Habeas Data / GDPR de la plataforma médica).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Prioridad absoluta a la lectura offline de datos clínicos PÚBLICOS.
 * - Prohibido persistir PII, sesiones o PINs en Cache Storage.
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

/**
 * Rutas sensibles EXCLUIDAS de toda estrategia de caché (corrección C-17).
 * Motivo de la exclusión por PII y seguridad de sesión:
 * - /api/auth/   → estado de sesión y cookies: cachearlas serviría una identidad
 *                  rancia tras el logout (suplantación local del panel privado).
 * - /api/admin/  → lotes de fábrica con PINs de activación (includePins=true):
 *                  secretos confidenciales que jamás deben tocar el disco.
 * - /api/profile → ficha médica completa del piloto (datos sensibles de salud,
 *                  cédula de identidad y contactos): PII protegida por Habeas Data.
 * - /api/gps/    → telemetría satelital en tiempo real: geolocalización privada.
 * Estas peticiones viajan directo a la red sin pasar por Cache Storage.
 */
const SENSITIVE_API_PREFIXES = [
  '/api/auth/',
  '/api/admin/',
  '/api/profile',
  '/api/gps/',
];

/** Determina si la ruta corresponde a un endpoint sensible (PII, sesión o PINs). */
function isSensitiveApiPath(pathname) {
  return SENSITIVE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Respeta la directiva `Cache-Control: no-store` emitida por el servidor:
 * las respuestas médicas/confidenciales con esa cabecera NUNCA se escriben
 * en Cache Storage. También descarta respuestas ausentes o no exitosas.
 */
function isStorableResponse(response) {
  if (!response || response.status !== 200) {
    return false;
  }
  const cacheControl = response.headers.get('Cache-Control') || '';
  return !cacheControl.toLowerCase().includes('no-store');
}

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

  // C-17 (CRITICAL): las rutas con PII, sesión o PINs se dejan pasar íntegras
  // a la red; el Service Worker no las toca ni las almacena jamás.
  if (isSensitiveApiPath(url.pathname)) {
    return;
  }

  // No interceptar chunks internos de compilación ni HMR de Next.js (_next/)
  // para prevenir colisiones de hash y ChunkLoadError por timeout
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  // Rutas de rescate: Estrategia Network-First con respaldo en Caché.
  // Cubre las vistas públicas (/emergency, /r/) y la ficha pública de rescate
  // (/api/emergency/, dato clínico de auxilio con cédula ya ofuscada por el
  // backend). Solo se persiste lo que el servidor autoriza (ver no-store).
  if (
    url.pathname.startsWith('/emergency') ||
    url.pathname.startsWith('/r/') ||
    url.pathname.startsWith('/api/emergency/')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isStorableResponse(response)) {
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

  // Recursos estáticos e imágenes: Estrategia Stale-While-Revalidate.
  // Nunca aplica a endpoints sensibles (ya excluidos arriba) y respeta no-store.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (isStorableResponse(networkResponse)) {
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
