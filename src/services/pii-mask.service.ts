/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Seguridad — Ofuscación de Datos Sensibles (PII Masking)
 * ARCHIVO: src/services/pii-mask.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Transformadores puros de ofuscación de datos personales sensibles exigidos
 * por la skill safe-security-and-compliance §5 y el §11 de
 * docs/BACKEND_CONTRACTS.md: en la vista pública de emergencia (`/r/[code]` y
 * `/api/emergency/[code]`) la cédula NUNCA se muestra completa, para evitar
 * robo de identidad ante escaneos callejeros no autorizados; el correo se
 * ofusca para registros (logs) y textos de campaña sin exponer la cuenta real.
 *
 * ENTRADAS: cadenas crudas provenientes de la base de datos o del formulario.
 * SALIDAS: cadenas enmascaradas listas para JSON público o consola.
 * DEPENDENCIAS: ninguna (funciones puras, sin base de datos ni entorno).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo debe quedar < 120).
 * - Cero datos hardcodeados o mocks de demostración.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

/** Carácter de enmascarado elegido: viñeta tipográfica, neutra y sin colisión con identificadores alfanuméricos. */
const MASK_CHAR = "•";

/** Cantidad de caracteres visibles del inicio (y del final) al ofuscar una cédula larga. */
const NATIONAL_ID_VISIBLE_EDGES = 2;

/** Longitud a partir de la cual una cédula se considera demasiado corta para mostrar ambos extremos sin regalar el valor completo. */
const NATIONAL_ID_SHORT_THRESHOLD = 4;

/** Caracteres del lado local de un correo que se conservan visibles antes del enmascarado. */
const EMAIL_VISIBLE_PREFIX = 2;

/**
 * Ofusca el número de identificación nacional (cédula) para la vista pública
 * de emergencia. Reglas documentadas:
 * - Se recortan espacios en blanco en los extremos; una cadena vacía retorna "".
 * - Si la longitud es <= 4 caracteres se conserva SOLO el último (mostrar 2+2
 *   filtraría la casi totalidad de un identificador corto).
 * - En cualquier otro caso se conservan los 2 primeros y los 2 últimos
 *   caracteres y se reemplaza el centro por un "•" por cada carácter oculto.
 * Ejemplo: `1712345678` → `17••••••78`.
 */
export function maskNationalId(nationalId: string): string {
  const trimmed = nationalId.trim();

  if (trimmed.length === 0) {
    return "";
  }

  if (trimmed.length <= NATIONAL_ID_SHORT_THRESHOLD) {
    const hiddenCount = trimmed.length - 1;
    return MASK_CHAR.repeat(hiddenCount) + trimmed.charAt(trimmed.length - 1);
  }

  const head = trimmed.slice(0, NATIONAL_ID_VISIBLE_EDGES);
  const tail = trimmed.slice(-NATIONAL_ID_VISIBLE_EDGES);
  const hiddenCount = trimmed.length - NATIONAL_ID_VISIBLE_EDGES * 2;
  return `${head}${MASK_CHAR.repeat(hiddenCount)}${tail}`;
}

/**
 * Ofusca la parte local de un correo electrónico conservando los 2 primeros
 * caracteres y el dominio completo, reemplazando el resto del local por "•"
 * por cada carácter oculto. Utilidad: logs de despacho de Gmail y plantillas
 * de correo donde el familiar debe reconocer su cuenta sin que un voyeur lea
 * la dirección completa. Reglas:
 * - Se recortan espacios extremos; una cadena vacía retorna "".
 * - Si no existe "@" o el local está vacío (formato no reconocido) se aplica
 *   la misma ofuscación que a una cédula, nunca el texto en claro.
 * Ejemplo: `carlos.perez@example.com` → `ca••••••••••@example.com`.
 */
export function maskEmail(email: string): string {
  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return "";
  }

  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) {
    return maskNationalId(trimmed);
  }

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex);
  const visibleCount = Math.min(EMAIL_VISIBLE_PREFIX, localPart.length);
  const hiddenCount = localPart.length - visibleCount;

  return `${localPart.slice(0, visibleCount)}${MASK_CHAR.repeat(hiddenCount)}${domainPart}`;
}
