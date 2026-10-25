/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Utilidades del Cliente de API (extraídas de api-client.ts)
 * ARCHIVO: src/lib/api-client-helpers.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Funciones auxiliares compartidas por el cliente HTTP centralizado
 * (src/lib/api-client.ts), extraídas para respetar el límite de líneas:
 *
 * 1. `lanzarErrorHttp`: desenvuelve el envoltorio de error del backend
 *    `{ error: { message } }` y lanza su texto humano tal cual, adjuntando el
 *    estado HTTP en `error.status` para que las vistas distingan una sesión
 *    inválida (401/403) de una simple caída de red. Cuando la respuesta es
 *    ilegible o inexistente (caída de red), lanza un único mensaje neutro, sin
 *    jerga técnica ni diagnósticos inventados.
 * 2. `normalizarContactos`: recorta y normaliza los contactos de emergencia
 *    SIN fabricar datos: no inventa identificadores ni supone parentescos
 *    "Familiar". Si la relación falta, la clave se omite y el backend la
 *    valida con su propio mensaje humano.
 * 3. `ensureContactUuid`: garantiza que todo contacto lleve un UUID válido
 *    exigido por `EmergencyContactSchema`, regenerándolo cuando el registro
 *    histórico trae un id artesanal (patrón "cnt_...") que el backend rechaza.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero mocks, cero datos fabricados, cero hardcoding de demostración.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import type { EmergencyContact } from "./api-types";

/** Único texto neutro cuando el backend no entrega un mensaje legible. */
export const ERROR_SIN_RESPUESTA = "No se pudo conectar con el servicio.";

/**
 * Excepción de transporte del cliente HTTP. Conserva el `status` real de la
 * respuesta para que las vistas privadas distingan una sesión inválida o
 * caducada (401/403 → volver al ingreso) de una simple caída de red o un 5xx
 * (→ ofrecer reintentar sin expulsar al usuario de su panel).
 */
export class HttpApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpApiError";
    this.status = status;
  }
}

/**
 * Lanza un HttpApiError con el mensaje humano que el backend devolvió en su
 * envoltorio `{ error: { message } }`. Si el cuerpo no es legible o no existe
 * (caída de red, respuesta no JSON), lanza el texto neutro con status 0.
 */
export async function lanzarErrorHttp(res: Response): Promise<never> {
  const err = await res.json().catch(() => null);
  throw new HttpApiError(
    err?.error?.message || ERROR_SIN_RESPUESTA,
    res.ok ? 0 : res.status,
  );
}

/**
 * Garantiza un identificador UUID válido para un contacto de emergencia.
 * El backend (`EmergencyContactSchema.id`) rechaza ids que no sean UUID, por
 * lo que un registro histórico con el patrón artesanal "cnt_..." debe
 * regenerarse con `crypto.randomUUID()` antes de reenviarlo.
 * @param id Identificador almacenado (puede faltar o ser inválido).
 * @returns El UUID original cuando es válido; uno nuevo en caso contrario.
 */
export function ensureContactUuid(id?: string | null): string {
  const candidate = (id || "").trim();
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_PATTERN.test(candidate)) {
    return candidate;
  }
  return crypto.randomUUID();
}

/**
 * Normaliza los contactos de emergencia antes de enviarlos al backend:
 * - Conserva el identificador real (el servidor exige un UUID válido;
 *   jamás se fabrican ids temporales que el backend rechazaría).
 * - Usa la relación real declarada por el usuario (`relation` o su alias
 *   de UI `relationship`); si falta, la clave se omite para que el
 *   servidor responda con su mensaje de validación humano.
 */
export function normalizarContactos(
  source: EmergencyContact[],
): Record<string, unknown>[] {
  return source.map((c) => {
    const relation = (c.relation || c.relationship || "").trim();
    return {
      id: c.id,
      name: c.name.trim(),
      ...(relation ? { relation } : {}),
      phone: c.phone.trim(),
      email: (c.email || "").trim(),
      isPrimary: c.isPrimary ?? false,
    };
  });
}
