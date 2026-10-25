/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Seguridad — Primitivas de Escritura Concurrente del Guard Throttle
 * ARCHIVO: src/services/throttle-retry.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Módulo auxiliar extraído de `throttle.service.ts` durante la corrección de la
 * auditoría H-01 para que ambos archivos queden holgadamente bajo el techo de
 * líneas. Concentra las primitivas de escritura tolerantes a concurrencia que
 * comparten el guard por FALLOS (`ensureThrottleAllowed` y
 * `registerThrottleFailure`, reservado al PIN) y el guard por CUOTA
 * (`consumeThrottle`, para las IPs públicas):
 * - `withThrottleRetry`: reintenta una escritura hasta 3 veces ante los
 *   errores conocidos de Prisma P2002 (carrera de inserción sobre la clave
 *   única), P2025 (fila borrada en paralelo por una purga) y P2034 (conflicto
 *   de serialización en PostgreSQL), conforme al §8 de BACKEND_CONTRACTS.md.
 * - `resetBucketWindow`: upsert que reinicia la ventana de un bucket
 *   (contador, inicio de ventana, bloqueo nulo y expiración con colchón).
 * No contiene lógica de negocio ni políticas: los umbrales y la clave canónica
 * (`buildBucketKey`) los aporta siempre `throttle.service.ts`, único dueño del
 * formato `scope:identificador` compartido con el Agente 2 (Ledger A1→A2 #1).
 *
 * ENTRADAS: operación asíncrona a reintentar / datos del bucket a reiniciar.
 * SALIDAS: resultado de la operación o último error propagado; void en upsert.
 * DEPENDENCIAS: @prisma/client y @/lib/db (singleton PrismaClient).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { ThrottlePolicy, ThrottleScope } from "@/services/throttle.service";

/** Número máximo de reintentos ante conflictos de concurrencia en escrituras. */
const MAX_WRITE_RETRIES = 3;

/** Factor de conversión de segundos a milisegundos para aritmética de fechas. */
const MS_PER_SECOND = 1000;

/**
 * Colchón de seguridad en segundos añadido a `expiresAt` (idéntico al de
 * `throttle.service.ts`): mantiene la fila visible un breve periodo tras el
 * vencimiento real para tolerar deriva de relojes entre nodos serverless; su
 * purga corre por cuenta de `purgeExpiredThrottleBuckets`.
 */
const EXPIRY_BUFFER_SECONDS = 60;

/**
 * Códigos de error conocido de Prisma que justifican reintentar la operación:
 * P2002 (clave única duplicada por carrera de inserción), P2025 (fila borrada
 * en paralelo por una purga) y P2034 (conflicto de serialización en
 * PostgreSQL), conforme al §8 de docs/BACKEND_CONTRACTS.md.
 */
const THROTTLE_RETRYABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  "P2002",
  "P2025",
  "P2034",
]);

/**
 * Ejecuta una escritura de base de datos reintentando hasta
 * `MAX_WRITE_RETRIES` veces ante conflictos de concurrencia (P2002 por carrera
 * de inserción sobre la clave única, P2025 si la fila fue purgada en paralelo,
 * P2034 por serialización). Cualquier otro error se propaga tal cual.
 */
export async function withThrottleRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_WRITE_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        THROTTLE_RETRYABLE_ERROR_CODES.has(error.code);
      if (!retryable || attempt === MAX_WRITE_RETRIES) {
        throw error;
      }
    }
  }
  // Inalcanzable en la práctica: el bucle siempre retorna o lanza.
  throw lastError;
}

/**
 * Reinicia la ventana de un bucket mediante upsert: fija el contador
 * (`attempts`), abre una ventana nueva desde `timestamp`, levanta cualquier
 * bloqueo previo y recalcula `expiresAt` como ahora + ventana + bloqueo +
 * colchón, de modo que la fila sobreviva visible hasta el final del castigo y
 * la purga periódica la recoja. Debe invocarse SIEMPRE dentro de
 * `withThrottleRetry`: el upsert es atómico por fila, pero dos inserciones
 * simultáneas sobre la misma clave única resuelven la carrera con P2002 y
 * reintento (segundo intento ya encuentra la fila y la actualiza).
 */
export async function resetBucketWindow(
  bucketKey: string,
  scope: ThrottleScope,
  attempts: number,
  timestamp: Date,
  policy: ThrottlePolicy,
): Promise<void> {
  const expiresAt = new Date(
    timestamp.getTime() +
      (policy.windowSeconds + policy.blockSeconds + EXPIRY_BUFFER_SECONDS) * MS_PER_SECOND,
  );

  await db.rateLimitBucket.upsert({
    where: { key: bucketKey },
    update: {
      attempts,
      windowStartedAt: timestamp,
      blockedUntil: null,
      expiresAt,
    },
    create: {
      key: bucketKey,
      scope,
      attempts,
      windowStartedAt: timestamp,
      blockedUntil: null,
      expiresAt,
    },
  });
}
