/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Utilidades — Registro de Eventos Estructurado en Consola (Logger)
 * ARCHIVO: src/lib/logger.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Emite logs estructurados de consola para todo el ciclo de vida del backend
 * SAFE: autenticación, activación de kits, alertas de emergencia, ventanas de
 * cooldown anti-spam, limitación de tasa y errores de infraestructura. Cada
 * línea lleva la marca [SAFE][nivel], un timestamp ISO 8601 en UTC, el nombre
 * del evento y la metadata en JSON SANITIZADO: cualquier clave que contenga
 * términos sensibles (password, secret, token, pin, cookie, authorization,
 * app_password, master_key) se ofusca con "[REDACTADO]" antes de imprimirse,
 * garantizando que jamás se filtren secretos ni PII médica a los logs.
 * El logger NUNCA lanza excepciones: cualquier fallo interno se contiene y se
 * deriva a un respaldo mínimo por console.error, porque un log defectuoso no
 * puede tumbar el despacho de una emergencia. Sin dependencias externas.
 *
 * CONTRATOS: docs/BACKEND_CONTRACTS.md §6 (src/lib/logger.ts).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Cabecera y comentarios en Español.
 * - Protección de datos médicos sensibles (PII): sanitización obligatoria.
 * ==============================================================================
 */

/** Niveles de severidad soportados por el registro estructurado de SAFE. */
export type LogLevel = "info" | "warn" | "error";

/**
 * Subcadenas (case-insensitive) que identifican claves confidenciales.
 * Toda clave cuyo nombre contenga alguno de estos términos se ofusca en los
 * logs: contraseñas, secretos de servicio, tokens JWT, PINs de activación,
 * cookies, cabeceras de autorización, app_password de Gmail y master key.
 */
const SENSITIVE_KEY_TOKENS: readonly string[] = [
  "password",
  "secret",
  "token",
  "pin",
  "cookie",
  "authorization",
  "app_password",
  "master_key",
];

/**
 * Determina si el nombre de una clave es sensible según la lista canónica.
 * @param key Nombre de la clave a evaluar.
 * @returns true si la clave debe ofuscarse en el log.
 */
function isSensitiveKey(key: string): boolean {
  const lowered = key.toLowerCase();
  return SENSITIVE_KEY_TOKENS.some((token) => lowered.includes(token));
}

/**
 * Sanitiza recursivamente un valor de metadata para su impresión segura.
 * - Claves sensibles → "[REDACTADO]" (la clave se conserva, el valor no).
 * - Arrays y objetos planos se recorren en profundidad.
 * - Referencias circulares se cortan con "[CIRCULAR]" en lugar de explotar.
 * - Restos de primitivos (string, number, boolean, null) se conservan.
 * @param value Valor arbitrario proveniente de la capa de negocio.
 * @param seen Conjunto de objetos ya visitados (detección de ciclos).
 * @returns Copia del valor lista para JSON.stringify sin filtrar secretos.
 */
function sanitizeValue(value: unknown, seen: Set<unknown>): unknown {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }
  seen.add(value);

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  const clean: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    clean[key] = isSensitiveKey(key) ? "[REDACTADO]" : sanitizeValue(entry, seen);
  }
  return clean;
}

/**
 * Registra un evento estructurado del sistema en la consola del servidor.
 * Formato de salida: [SAFE][nivel] <ISO-UTC> <evento> <meta JSON sanitizada>.
 * Nunca lanza excepciones: si la serialización o la impresión fallan, se
 * emite un respaldo mínimo por console.error y la ejecución continúa.
 * @param level Severidad del evento ("info" | "warn" | "error").
 * @param event Nombre canónico del evento (p. ej. "api.error").
 * @param meta Metadata opcional; se ofuscan todas las claves sensibles.
 * @returns void
 */
export function logEvent(
  level: LogLevel,
  event: string,
  meta?: Record<string, unknown>,
): void {
  try {
    const timestamp = new Date().toISOString();
    const sanitizedMeta =
      meta === undefined ? undefined : sanitizeValue(meta, new Set<unknown>());
    const metaJson =
      sanitizedMeta === undefined ? "{}" : JSON.stringify(sanitizedMeta);
    const line = `[SAFE][${level}] ${timestamp} ${event} ${metaJson}`;

    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  } catch {
    // Respaldo terminal: el registro jamás debe interrumpir el flujo de auxilio.
    try {
      console.error(`[SAFE][error] ${new Date().toISOString()} log.fallback`);
    } catch {
      // Silencio absoluto: ni el respaldo puede propagar excepciones.
    }
  }
}
