/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Seguridad — Control de Tasa Persistente y Anti-Fuerza Bruta
 * ARCHIVO: src/services/ratelimit.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Sistema de limitación de tasa (Rate Limiting) y defensa contra fuerza bruta
 * con ventana deslizante persistida 100% en base de datos PostgreSQL mediante
 * el modelo RateLimitBucket.
 *
 * Elimina completamente la dependencia de memoria volátil o Redis para que
 * los bloqueos de PIN, login y endpoints críticos sobrevivan a reinicios de
 * contenedores y despliegues serverless. Implementa reintentos automáticos
 * ante conflictos de concurrencia de base de datos (código Prisma P2034).
 *
 * CLAVE CANÓNICA COMPARTIDA (hallazgo #3, CRÍTICO corregido): el bucket se
 * indexa por `scope:identificador`, con el scope SIEMPRE en kebab-case
 * minúsculo (única fuente de verdad: el campo `.scope` de cada política de
 * RATE_LIMITS) y el identificador SIN plegado de mayúsculas, idéntico al
 * formato de throttle.service.ts de la Parte 1 (ej. `pin:SAFE-0001`). Antes
 * se aplicaba `.toLowerCase()` a la clave completa: los folios SAFE-XXXX
 * llegaban en mayúsculas y creaban DOS filas independientes frente al guard
 * de la Parte 1, duplicando la cuota de intentos del atacante.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Persistencia inmutable y transaccional en PostgreSQL.
 * - Mensajes de error en Español.
 * ==============================================================================
 */

import { db } from "@/lib/db";
import { AppError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * Política que define el ámbito canónico, el umbral de intentos y los tiempos
 * de penalización de un frente de protección.
 */
export interface RateLimitPolicy {
  /**
   * Ámbito canónico en kebab-case minúsculo (ej. "login-ip", "upload-ip").
   * Es la ÚNICA fuente de verdad del prefijo de la clave del bucket y coincide
   * con los ThrottleScope de throttle.service.ts (Parte 1) y con la columna
   * `RateLimitBucket.scope` del esquema Prisma (hallazgo #3).
   */
  scope: string;
  /** Cantidad máxima de intentos permitidos dentro de la ventana. */
  maxAttempts: number;
  /** Duración de la ventana en segundos antes de restablecer el conteo. */
  windowSeconds: number;
  /** Duración del bloqueo temporal en segundos si se excede el límite. */
  blockSeconds: number;
}

/**
 * Estado actual evaluado del bucket para la clave y ámbito consultados.
 */
export interface RateLimitStatus {
  /** Indica si la petición está autorizada para procesarse. */
  allowed: boolean;
  /** Cantidad de intentos contabilizados en la ventana activa. */
  attempts: number;
  /** Cantidad de intentos restantes antes de disparar el bloqueo. */
  remaining: number;
  /** Marca temporal UTC hasta la cual la clave permanece bloqueada (null si no está bloqueada). */
  blockedUntil: Date | null;
  /** Segundos que el cliente debe esperar antes de reintentar (0 si está permitido). */
  retryAfterSeconds: number;
}

/**
 * Políticas preconfiguradas del sistema para los distintos frentes de
 * protección. Las CLAVES del objeto siguen en camelCase (son identificadores
 * TypeScript para los consumidores), pero el campo `.scope` de cada política
 * está en kebab-case canónico, alineado con ThrottleScope de la Parte 1
 * ("pin", "emergency-alert-ip", "public-emergency-ip", "gateway-ip") y con la
 * columna `scope` de RateLimitBucket (hallazgo #3).
 */
export const RATE_LIMITS: {
  pin: RateLimitPolicy;
  login: RateLimitPolicy;
  loginIp: RateLimitPolicy;
  emergencyAlertIp: RateLimitPolicy;
  publicEmergencyIp: RateLimitPolicy;
  uploadIp: RateLimitPolicy;
  gatewayIp: RateLimitPolicy;
} = {
  /** Verificación de PIN de activación de 6 dígitos: 5 intentos cada 15 min, bloqueo de 15 min. */
  pin: { scope: "pin", maxAttempts: 5, windowSeconds: 900, blockSeconds: 900 },

  /** Fallos de inicio de sesión por cuenta de correo: 5 intentos cada 15 min, bloqueo de 15 min. */
  login: { scope: "login", maxAttempts: 5, windowSeconds: 900, blockSeconds: 900 },

  /** Intentos de login por dirección IP: 20 peticiones cada 15 min. */
  loginIp: { scope: "login-ip", maxAttempts: 20, windowSeconds: 900, blockSeconds: 900 },

  /** Despacho de alerta de emergencia por IP: 30 peticiones cada 60 s. */
  emergencyAlertIp: { scope: "emergency-alert-ip", maxAttempts: 30, windowSeconds: 60, blockSeconds: 180 },

  /** Consulta pública de ficha médica por IP: 60 lecturas por minuto. */
  publicEmergencyIp: { scope: "public-emergency-ip", maxAttempts: 60, windowSeconds: 60, blockSeconds: 120 },

  /** Subida de fotos de rostro a Cloudinary por IP: 10 imágenes cada 5 min. */
  uploadIp: { scope: "upload-ip", maxAttempts: 10, windowSeconds: 300, blockSeconds: 600 },

  /** Gateway de casco físico (/r/[code]) por IP: 60 escaneos por minuto. */
  gatewayIp: { scope: "gateway-ip", maxAttempts: 60, windowSeconds: 60, blockSeconds: 120 },
};

/**
 * Construye la clave canónica del bucket combinando ámbito y discriminador
 * (hallazgo #3): SOLO el scope se normaliza a minúsculas/kebab-case por
 * convención; el identificador conserva EXACTAMENTE su casing original
 * (los folios SAFE-XXXX y las IPs ya llegan normalizados por sus esquemas).
 * Formato idéntico al de throttle.service.ts (`scope:identificador`) para que
 * ambos guards compartan la misma fila de RateLimitBucket sin duplicar cuota.
 */
function buildBucketKey(scope: string, key: string): string {
  return `${scope.trim().toLowerCase()}:${key.trim()}`;
}

/**
 * Resuelve el scope canónico de una llamada: el campo `.scope` kebab-case de
 * la política es la única fuente de verdad (hallazgo #3). El argumento `scope`
 * de las firmas públicas se conserva por compatibilidad con los consumidores
 * que aún transmiten literales heredados en camelCase (ej. "loginIp" desde
 * login/route.ts): aquí se canonicalizan de forma transparente, sin exigir
 * cambios en los llamadores y sin duplicar buckets por variantes de casing.
 */
function resolveCanonicalScope(scope: string, policy?: RateLimitPolicy): string {
  const effectiveScope = policy?.scope ?? scope;
  return effectiveScope.trim().toLowerCase();
}

/**
 * Ejecuta una operación de base de datos con reintentos exponenciales leves
 * ante excepciones de concurrencia serializable de PostgreSQL (P2034).
 */
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (
        attempt < maxRetries &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002")
      ) {
        // Pausa breve aleatoria entre 20 y 80 ms
        const jitter = Math.floor(Math.random() * 60) + 20;
        await new Promise((res) => setTimeout(res, jitter));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Consulta el estado actual de un bucket sin incrementar contadores.
 * El scope efectivo de la clave es el canónico de la política (hallazgo #3).
 */
export async function getRateLimitStatus(
  scope: string,
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitStatus> {
  const bucketKey = buildBucketKey(resolveCanonicalScope(scope, policy), key);
  const now = new Date();

  const bucket = await db.rateLimitBucket.findUnique({
    where: { key: bucketKey },
  });

  if (!bucket) {
    return {
      allowed: true,
      attempts: 0,
      remaining: policy.maxAttempts,
      blockedUntil: null,
      retryAfterSeconds: 0,
    };
  }

  // Si el bucket expiró completamente, considerar ventana limpia
  if (bucket.expiresAt <= now) {
    return {
      allowed: true,
      attempts: 0,
      remaining: policy.maxAttempts,
      blockedUntil: null,
      retryAfterSeconds: 0,
    };
  }

  // Verificar si se encuentra bajo bloqueo activo
  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    const diffMs = bucket.blockedUntil.getTime() - now.getTime();
    const retryAfter = Math.max(1, Math.ceil(diffMs / 1000));
    return {
      allowed: false,
      attempts: bucket.attempts,
      remaining: 0,
      blockedUntil: bucket.blockedUntil,
      retryAfterSeconds: retryAfter,
    };
  }

  const remaining = Math.max(0, policy.maxAttempts - bucket.attempts);
  const allowed = bucket.attempts < policy.maxAttempts;

  return {
    allowed,
    attempts: bucket.attempts,
    remaining,
    blockedUntil: null,
    retryAfterSeconds: allowed ? 0 : policy.blockSeconds,
  };
}

/**
 * Registra un intento fallido (ej. PIN erróneo o credencial inválida).
 * Si los fallos superan `maxAttempts`, activa inmediatamente el bloqueo por `blockSeconds`.
 * La fila se indexa y se rotula con el scope canónico kebab-case de la política
 * (hallazgo #3), compatible con las filas homónimas de throttle.service.ts.
 */
export async function recordRateLimitFailure(
  scope: string,
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitStatus> {
  const canonicalScope = resolveCanonicalScope(scope, policy);
  const bucketKey = buildBucketKey(canonicalScope, key);

  return withRetry(async () => {
    const now = new Date();
    const existing = await db.rateLimitBucket.findUnique({
      where: { key: bucketKey },
    });

    // 1. Si no existe o ya expiró la ventana anterior, iniciar nuevo ciclo
    if (!existing || existing.expiresAt <= now) {
      const windowStartedAt = now;
      const expiresAt = new Date(now.getTime() + policy.windowSeconds * 1000);
      const isBlocked = policy.maxAttempts <= 1;
      const blockedUntil = isBlocked
        ? new Date(now.getTime() + policy.blockSeconds * 1000)
        : null;

      const bucket = await db.rateLimitBucket.upsert({
        where: { key: bucketKey },
        create: {
          key: bucketKey,
          scope: canonicalScope,
          attempts: 1,
          windowStartedAt,
          blockedUntil,
          expiresAt: isBlocked && blockedUntil ? blockedUntil : expiresAt,
        },
        update: {
          attempts: { increment: 1 },
          windowStartedAt,
          blockedUntil,
          expiresAt: isBlocked && blockedUntil ? blockedUntil : expiresAt,
        },
      });

      const isNowBlocked = bucket.attempts >= policy.maxAttempts;
      return {
        allowed: !isNowBlocked,
        attempts: bucket.attempts,
        remaining: Math.max(0, policy.maxAttempts - bucket.attempts),
        blockedUntil: bucket.blockedUntil,
        retryAfterSeconds: isNowBlocked ? policy.blockSeconds : 0,
      };
    }

    // 2. Si ya estaba bloqueado y el bloqueo sigue vigente, rechazar inmediatamente
    if (existing.blockedUntil && existing.blockedUntil > now) {
      const retryAfter = Math.max(
        1,
        Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 1000),
      );
      return {
        allowed: false,
        attempts: existing.attempts,
        remaining: 0,
        blockedUntil: existing.blockedUntil,
        retryAfterSeconds: retryAfter,
      };
    }

    // 3. Incrementar conteo de manera atómica
    const updated = await db.rateLimitBucket.update({
      where: { key: bucketKey },
      data: {
        attempts: { increment: 1 },
      },
      select: {
        attempts: true,
      },
    });

    const nextAttempts = updated.attempts;
    const isNowBlocked = nextAttempts >= policy.maxAttempts;
    let blockedUntil: Date | null = null;

    if (isNowBlocked) {
      blockedUntil = new Date(now.getTime() + policy.blockSeconds * 1000);
      const newExpiresAt = new Date(blockedUntil.getTime() + policy.windowSeconds * 1000);

      await db.rateLimitBucket.update({
        where: { key: bucketKey },
        data: {
          blockedUntil,
          expiresAt: newExpiresAt,
        },
      });
    }

    const remaining = Math.max(0, policy.maxAttempts - nextAttempts);
    const retryAfter = isNowBlocked ? policy.blockSeconds : 0;

    return {
      allowed: !isNowBlocked,
      attempts: nextAttempts,
      remaining,
      blockedUntil,
      retryAfterSeconds: retryAfter,
    };
  });
}

/**
 * Consume una cuota de petición en endpoints que limitan la frecuencia global (ej. subida de fotos).
 */
export async function consumeRateLimit(
  scope: string,
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitStatus> {
  return recordRateLimitFailure(scope, key, policy);
}

/**
 * Limpia los intentos fallidos tras una acción exitosa (ej. login correcto).
 * Acepta la política opcional para resolver el mismo scope canónico con el que
 * se escribió la fila (hallazgo #3); sin política, canonicaliza el literal
 * recibido, que coincide con las claves kebab-case de una sola palabra
 * ("login", "pin") usadas por los consumidores actuales.
 */
export async function clearRateLimit(
  scope: string,
  key: string,
  policy?: RateLimitPolicy,
): Promise<void> {
  const bucketKey = buildBucketKey(resolveCanonicalScope(scope, policy), key);
  try {
    await db.rateLimitBucket.deleteMany({
      where: { key: bucketKey },
    });
  } catch {
    // Si falla la conexión, ignorar para no interrumpir el flujo principal
  }
}

/**
 * Valida que el recurso no esté bajo bloqueo temporal.
 * Lanza AppError("RATE_LIMIT", ..., 429) si el cliente superó el límite.
 */
export async function enforceNotBlocked(
  scope: string,
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitStatus> {
  const status = await getRateLimitStatus(scope, key, policy);

  if (!status.allowed) {
    const minutes = Math.ceil(status.retryAfterSeconds / 60);
    const message =
      minutes > 1
        ? `Demasiados intentos fallidos. Por seguridad, intente de nuevo en ${minutes} minutos.`
        : `Demasiados intentos fallidos. Por seguridad, intente de nuevo en ${status.retryAfterSeconds} segundos.`;

    throw new AppError("RATE_LIMIT", message, 429, {
      retryAfterSeconds: status.retryAfterSeconds,
      blockedUntil: status.blockedUntil,
    });
  }

  return status;
}
