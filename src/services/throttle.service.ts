/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Seguridad — Guard Anti-Fuerza-Bruta de la Parte 1 (Throttle)
 * ARCHIVO: src/services/throttle.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Guardián propio y NO invasivo de la Parte 1 (Backend: BD, Gateway y
 * Emergencia) contra ataques de fuerza bruta y spam de despacho. Protege el
 * PIN de activación de 6 dígitos (máximo 5 intentos por IP o código, HTTP 429
 * durante 15 minutos según la skill safe-security-and-compliance §2), la cuota
 * de Gmail SMTP ante alertas repetidas por IP y la consulta pública de fichas
 * médicas por IP.
 *
 * DOS MODOS DE OPERACIÓN de este guard:
 * - Por FALLOS (`ensureThrottleAllowed` + `registerThrottleFailure`): solo los
 *   intentos erróneos consumen cuota; es el modo del PIN de activación, donde
 *   un acierto limpia el contador con `clearThrottle`.
 * - Por CUOTA (`consumeThrottle`, corrección H-01): TODA petición consume una
 *   unidad, falle o no; es el modo de las entradas públicas por IP (gateway
 *   del casco, alerta de emergencia y ficha médica), donde el spam no genera
 *   fallos registrables y el modo por fallos dejaría el límite muerto.
 *
 * Persiste el estado 100% en PostgreSQL mediante el modelo Prisma
 * `RateLimitBucket` ya existente en el schema, usando la MISMA clave canónica
 * `scope:identificador` solicitada a AGENTE 2 (docs/LIVE_ARCHITECTURE_LEDGER.md,
 * Solicitud A1→A2 #1), de modo que cuando el Agente 2 entregue su
 * `src/services/ratelimit.service.ts` (custodia EXCLUSIVA del Agente 2, jamás
 * tocado por este archivo) el estado anti-fuerza-bruta sea compartido y
 * compatible sin duplicar información. Este guard existe porque la Regla de
 * Independencia del plan exige que la Parte 1 compile y sea 100% autónoma.
 *
 * ENTRADAS: ámbito (ThrottleScope), identificador (código de dispositivo, IP o
 * combinación `code:ip`) y política (ThrottlePolicy) desde cada endpoint.
 * SALIDAS: ninguna (permite), AppError("RATE_LIMIT", 429) al superar umbrales,
 * contaje de filas purgadas en mantenimiento.
 * DEPENDENCIAS: @/lib/db (singleton PrismaClient), @/lib/env (getEnv dentro de
 * funciones), @/lib/api-response (AppError), @/lib/logger (logEvent),
 * node:crypto (anonimización de IPs en logs) y @/services/throttle-retry
 * (primitivas de escritura concurrente: reintentos y reinicio de ventana).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (reintentos extraídos a throttle-retry).
 * - Cero datos hardcodeados o mocks de demostración.
 * - Comentarios canónicos en Español; mensajes de error humanos, sin jerga.
 * - Concurrencia: reintentos (máx 3) ante P2002/P2025/P2034 y transacción
 *   interactiva en el consumo de cuota (ver @/services/throttle-retry).
 * ==============================================================================
 */

import { createHash } from "node:crypto";

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/api-response";
import { logEvent } from "@/lib/logger";
import { resetBucketWindow, withThrottleRetry } from "@/services/throttle-retry";

/**
 * Política de protección: umbrales de intentos y duración de la ventana
 * deslizante y del bloqueo, expresados todos en segundos.
 */
export interface ThrottlePolicy {
  /** Máximo de intentos fallidos permitidos antes de bloquear. */
  maxAttempts: number;
  /** Duración de la ventana de conteo en segundos desde el primer fallo. */
  windowSeconds: number;
  /** Duración del bloqueo (ventana de castigo) en segundos al exceder el límite. */
  blockSeconds: number;
}

/**
 * Ámbitos protegidos por este guard de la Parte 1. Los nombres coinciden con
 * los declarados en la Solicitud A1→A2 #1 del Ledger para que el servicio de
 * AGENTE 2 comparta exactamente los mismos estados de bucket. El ámbito
 * `gateway-ip` (corrección H-01) cubre la cuota por petición del gateway
 * público `/r/[code]`, consumida en cada acceso mediante `consumeThrottle`.
 */
export type ThrottleScope =
  | "pin"
  | "emergency-alert-ip"
  | "public-emergency-ip"
  | "gateway-ip";

/** Factor de conversión de segundos a milisegundos para aritmética de fechas. */
const MS_PER_SECOND = 1000;

/**
 * Colchón de seguridad en segundos añadido a `expiresAt`. Mantiene la fila
 * visible un breve periodo tras el vencimiento real para tolerar deriva de
 * relojes entre nodos serverless; su purga corre por cuenta de
 * `purgeExpiredThrottleBuckets`.
 */
const EXPIRY_BUFFER_SECONDS = 60;

/**
 * Política para la verificación del PIN de activación de 6 dígitos.
 * Se construye SIEMPRE desde `getEnv()` dentro de la función (nunca en el
 * nivel superior del módulo) respetando los umbrales de la skill de seguridad
 * §2: máximo 5 intentos y bloqueo de 15 minutos, configurables vía
 * PIN_MAX_ATTEMPTS y PIN_BLOCK_MINUTES. La ventana de conteo dura lo mismo que
 * el bloqueo: transcurrido el castigo, el código o IP parte de cero.
 */
export function pinPolicy(): ThrottlePolicy {
  const env = getEnv();
  const blockSeconds = env.PIN_BLOCK_MINUTES * 60;
  return {
    maxAttempts: env.PIN_MAX_ATTEMPTS,
    windowSeconds: blockSeconds,
    blockSeconds,
  };
}

/**
 * Política anti-spam de despacho de alertas de emergencia por dirección IP.
 * Un transeúnte malintencionado no puede agotar la cuota de Gmail SMTP
 * escaneando el mismo casco: máximo 10 peticiones por minuto y 60 segundos
 * de enfriamiento al superarlo (el cooldown de 3 min por dispositivo lo
 * aporta aparte `cooldown.service.ts`).
 */
export const EMERGENCY_ALERT_IP_POLICY: ThrottlePolicy = {
  maxAttempts: 10,
  windowSeconds: 60,
  blockSeconds: 60,
};

/**
 * Política de consulta pública de la ficha médica (`/api/emergency/[code]`)
 * por IP: 30 lecturas por minuto con 5 minutos de bloqueo, para frenar
 * raspado masivo de fichas sin afectar al rescatista legítimo.
 */
export const PUBLIC_EMERGENCY_IP_POLICY: ThrottlePolicy = {
  maxAttempts: 30,
  windowSeconds: 60,
  blockSeconds: 300,
};

/**
 * Política de cuota del gateway público del casco (`/r/[code]`): 60 peticiones
 * por minuto y por IP con 5 minutos de bloqueo al superarlas. Cuota amplia a
 * propósito porque es la entrada MÁS crítica del sistema y la consumen TODAS
 * las peticiones legítimas (rescatistas, taller y enlaces reenviados por
 * mensajería) mediante `consumeThrottle`, no solo las fallidas.
 */
export const GATEWAY_IP_POLICY: ThrottlePolicy = {
  maxAttempts: 60,
  windowSeconds: 60,
  blockSeconds: 300,
};

/**
 * Construye la clave canónica del bucket en la tabla `RateLimitBucket`:
 * `scope:identificador` (literal, en minúsculas el prefijo de ámbito).
 * Ejemplo: `pin:SAFE-0001:203.0.113.9`. AGENTE 2 debe conservar este mismo
 * formato para que el estado anti-fuerza-bruta sea compartido (Ledger,
 * Solicitud A1→A2 #1).
 */
export function buildBucketKey(scope: ThrottleScope, identifier: string): string {
  return `${scope}:${identifier}`;
}

/**
 * Fecha de expiración de una ventana recién abierta o restablecida:
 * ahora + ventana + bloqueo + colchón. Así la fila sobrevive visible hasta el
 * final del castigo más el colchón, y `purgeExpiredThrottleBuckets` la recoge.
 */
function computeWindowExpiry(now: Date, policy: ThrottlePolicy): Date {
  const totalSeconds = policy.windowSeconds + policy.blockSeconds + EXPIRY_BUFFER_SECONDS;
  return new Date(now.getTime() + totalSeconds * MS_PER_SECOND);
}

/**
 * Fecha de expiración cuando se activa un bloqueo: el mayor valor entre el
 * final del bloqueo + colchón y la expiración natural de la ventana, para que
 * la fila nunca desaparezca antes de que termine el castigo.
 */
function computeBlockExpiry(blockedUntil: Date, now: Date, policy: ThrottlePolicy): Date {
  const afterBlockMs = blockedUntil.getTime() + EXPIRY_BUFFER_SECONDS * MS_PER_SECOND;
  const windowMs = computeWindowExpiry(now, policy).getTime();
  return new Date(Math.max(afterBlockMs, windowMs));
}

/**
 * Segundos (redondeados hacia arriba, mínimo 1) que faltan hasta que se
 * levante el bloqueo activo. Se expone como `retryAfterSeconds` en los
 * detalles del error 429 para que el cliente espere lo exacto.
 */
function computeRetryAfterSeconds(blockedUntil: Date, now: Date): number {
  return Math.max(1, Math.ceil((blockedUntil.getTime() - now.getTime()) / MS_PER_SECOND));
}

/**
 * Error humano estándar de exceso de intentos (HTTP 429, código RATE_LIMIT).
 * Sin jerga técnica y sin filtrar información interna, según las reglas de
 * respuesta de docs/BACKEND_CONTRACTS.md §2 y §6.
 */
function throttleRateLimitError(retryAfterSeconds: number): AppError {
  return new AppError(
    "RATE_LIMIT",
    "Has superado el número de intentos permitidos. Espera unos minutos e inténtalo de nuevo.",
    429,
    { retryAfterSeconds },
  );
}

/**
 * Anonimiza un identificador (IP o código) para los avisos de bloqueo: hash
 * SHA-256 truncado a 12 hexadecimales. Permite correlacionar eventos del mismo
 * origen en los logs SIN registrar jamás la IP cruda (cero PII, según la skill
 * safe-security-and-compliance).
 */
function anonymizeIdentifier(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex").slice(0, 12);
}

/**
 * Punto de entrada de los endpoints: verifica que el identificador pueda
 * actuar AHORA bajo la política indicada. Si el bucket está bloqueado lanza
 * AppError("RATE_LIMIT", 429) con `retryAfterSeconds`; si la ventana o la
 * expiración vencieron, restablece la fila (intentos a cero, nuevo inicio de
 * ventana, sin bloqueo) mediante upsert transaccional tolerante a carreras.
 * No escribe nada cuando el bucket no existe o sigue dentro de ventana sana.
 */
export async function ensureThrottleAllowed(
  scope: ThrottleScope,
  identifier: string,
  policy: ThrottlePolicy,
  now?: Date,
): Promise<void> {
  const bucketKey = buildBucketKey(scope, identifier);
  const timestamp = now ?? new Date();

  const bucket = await db.rateLimitBucket.findUnique({ where: { key: bucketKey } });
  if (!bucket) {
    return;
  }

  if (bucket.blockedUntil !== null && bucket.blockedUntil > timestamp) {
    throw throttleRateLimitError(computeRetryAfterSeconds(bucket.blockedUntil, timestamp));
  }

  const windowClosed =
    timestamp.getTime() >=
    bucket.windowStartedAt.getTime() + policy.windowSeconds * MS_PER_SECOND;
  const lifetimeClosed = bucket.expiresAt <= timestamp;

  if (windowClosed || lifetimeClosed) {
    await withThrottleRetry(() => resetBucketWindow(bucketKey, scope, 0, timestamp, policy));
  }
}

/**
 * Punto de entrada por CUOTA (corrección H-01): consume una unidad de la
 * política en CADA petición, falle o no, y permite o rechaza en el mismo acto.
 * Protege las entradas públicas por IP (`gateway-ip`, `emergency-alert-ip` y
 * `public-emergency-ip`), donde el spam no produce fallos registrables y el
 * modo por fallos dejaría el rate limit muerto. Reglas: (a) bucket con
 * `blockedUntil > now` → AppError("RATE_LIMIT", 429) con `retryAfterSeconds`
 * exacto, sin escribir nada; (b) bucket inexistente o con la ventana
 * (`windowStartedAt + windowSeconds`) o `expiresAt` vencidos → upsert que
 * reinicia la cuenta (attempts = 1, nueva ventana, sin bloqueo, expiración =
 * ventana + bloqueo + colchón de 60 s); (c) bucket dentro de la ventana →
 * `increment` atómico y, si los intentos resultantes superan `maxAttempts`,
 * `blockedUntil = now + blockSeconds` y el mismo 429. El incremento y el
 * bloqueo condicional viajan en UNA transacción interactiva para que dos
 * peticiones concurrentes no puedan saltarse la cuota ni duplicar el castigo,
 * y los conflictos P2002/P2025/P2034 se reintentan con `withThrottleRetry`,
 * igual que el resto del archivo. Al bloquear emite `logEvent("warn", ...)`
 * en español con el origen anonimizado (hash SHA-256 truncado), nunca la IP.
 */
export async function consumeThrottle(
  scope: ThrottleScope,
  identifier: string,
  policy: ThrottlePolicy,
  now?: Date,
): Promise<void> {
  const bucketKey = buildBucketKey(scope, identifier);
  const timestamp = now ?? new Date();

  const blockedUntil = await withThrottleRetry<Date | null>(async () => {
    const current = await db.rateLimitBucket.findUnique({ where: { key: bucketKey } });

    // (a) Bloqueo vigente: rechazo inmediato con la espera exacta, sin escribir.
    if (
      current !== null &&
      current.blockedUntil !== null &&
      current.blockedUntil > timestamp
    ) {
      return current.blockedUntil;
    }

    const windowExpired =
      current === null ||
      timestamp.getTime() >=
        current.windowStartedAt.getTime() + policy.windowSeconds * MS_PER_SECOND ||
      current.expiresAt <= timestamp;

    // (b) Bucket nuevo o ventana vencida: la cuenta se reinicia en 1 petición.
    if (windowExpired) {
      await resetBucketWindow(bucketKey, scope, 1, timestamp, policy);
      return null;
    }

    // (c) Ventana vigente: consumo atómico + bloqueo condicional en una tx.
    return db.$transaction(async (tx) => {
      const updated = await tx.rateLimitBucket.update({
        where: { key: bucketKey },
        data: { attempts: { increment: 1 } },
      });

      // Un competidor concurrente pudo fijar el castigo entre la lectura
      // previa y esta transacción: se respeta su bloqueo sin sobrescribirlo.
      if (updated.blockedUntil !== null && updated.blockedUntil > timestamp) {
        return updated.blockedUntil;
      }

      if (updated.attempts <= policy.maxAttempts) {
        return null;
      }

      const penaltyUntil = new Date(timestamp.getTime() + policy.blockSeconds * MS_PER_SECOND);
      await tx.rateLimitBucket.update({
        where: { key: bucketKey },
        data: {
          blockedUntil: penaltyUntil,
          expiresAt: computeBlockExpiry(penaltyUntil, timestamp, policy),
        },
      });
      return penaltyUntil;
    });
  });

  if (blockedUntil !== null) {
    logEvent("warn", "Seguridad: cuota de peticiones agotada, origen bloqueado", {
      scope,
      origenAnonimizado: anonymizeIdentifier(identifier),
      bloqueoSegundos: policy.blockSeconds,
    });

    throw new AppError(
      "RATE_LIMIT",
      "Has superado el número de peticiones permitidas. Espera unos minutos e inténtalo de nuevo.",
      429,
      { retryAfterSeconds: computeRetryAfterSeconds(blockedUntil, timestamp) },
    );
  }
}

/**
 * Registra un intento fallido (PIN erróneo, cuota de alerta consumida, etc.).
 * Crea la fila si no existe, abre ventana nueva si la anterior venció, o
 * incrementa el contador dentro de la ventana vigente usando `increment`
 * atómico. Cuando los intentos alcanzan `maxAttempts` y no había bloqueo
 * activo, fija `blockedUntil = now + blockSeconds`, extiende `expiresAt` y
 * emite un `logEvent("warn", ...)` en español SIN registrar el identificador
 * crudo (IPs y códigos se anonimizan según la skill de seguridad). La llamada
 * siguiente a `ensureThrottleAllowed` responderá 429; por eso aquí se retorna
 * sin estado.
 */
export async function registerThrottleFailure(
  scope: ThrottleScope,
  identifier: string,
  policy: ThrottlePolicy,
  now?: Date,
): Promise<void> {
  const bucketKey = buildBucketKey(scope, identifier);
  const timestamp = now ?? new Date();

  await withThrottleRetry(async () => {
    const current = await db.rateLimitBucket.findUnique({ where: { key: bucketKey } });

    const windowExpired =
      current === null ||
      timestamp.getTime() >=
        current.windowStartedAt.getTime() + policy.windowSeconds * MS_PER_SECOND ||
      current.expiresAt <= timestamp;

    if (windowExpired) {
      await resetBucketWindow(bucketKey, scope, 1, timestamp, policy);
      return;
    }

    const alreadyBlocked = current.blockedUntil !== null && current.blockedUntil > timestamp;
    if (alreadyBlocked) {
      // Fallos durante el castigo: se contabilizan pero NO se extiende el
      // bloqueo, para impedir un candado permanente por reintento constante.
      await db.rateLimitBucket.update({
        where: { key: bucketKey },
        data: { attempts: { increment: 1 } },
      });
      return;
    }

    const nextAttempts = current.attempts + 1;

    if (nextAttempts >= policy.maxAttempts) {
      const blockedUntil = new Date(timestamp.getTime() + policy.blockSeconds * MS_PER_SECOND);
      await db.rateLimitBucket.update({
        where: { key: bucketKey },
        data: {
          attempts: { increment: 1 },
          blockedUntil,
          expiresAt: computeBlockExpiry(blockedUntil, timestamp, policy),
        },
      });

      logEvent("warn", "Seguridad: ventana de protección activada por exceso de intentos", {
        scope,
        intentos: nextAttempts,
        bloqueoSegundos: policy.blockSeconds,
      });
      return;
    }

    await db.rateLimitBucket.update({
      where: { key: bucketKey },
      data: { attempts: { increment: 1 } },
    });
  });
}

/**
 * Limpia los intentos registrados tras un éxito (por ejemplo, PIN correcto o
 * alerta válida). Usa `deleteMany` por clave para que sea idempotente: si la
 * fila ya no existe, la operación es un no-op sin lanzar errores.
 */
export async function clearThrottle(scope: ThrottleScope, identifier: string): Promise<void> {
  const bucketKey = buildBucketKey(scope, identifier);
  await db.rateLimitBucket.deleteMany({ where: { key: bucketKey } });
}

/**
 * Utilitario de higiene para seed y mantenimiento: elimina todas las filas de
 * `RateLimitBucket` cuya expiración (ventana + castigo + colchón) ya venció,
 * devolviendo cuántas se borraron. Mantiene la tabla acotada sin tocar buckets
 * vivos del guard de AGENTE 2, porque ambos comparten la misma clave canónica.
 */
export async function purgeExpiredThrottleBuckets(now?: Date): Promise<number> {
  const timestamp = now ?? new Date();
  const result = await db.rateLimitBucket.deleteMany({
    where: { expiresAt: { lt: timestamp } },
  });
  return result.count;
}
