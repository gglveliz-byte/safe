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
 *    `{ error: { message } }` y lanza su texto humano tal cual. Cuando la
 *    respuesta es ilegible o inexistente (caída de red), lanza un único
 *    mensaje neutro, sin jerga técnica ni diagnósticos inventados.
 * 2. `normalizarContactos`: recorta y normaliza los contactos de emergencia
 *    SIN fabricar datos: no inventa identificadores ni supone parentescos
 *    "Familiar". Si la relación falta, la clave se omite y el backend la
 *    valida con su propio mensaje humano.
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
 * Lanza un Error con el mensaje humano que el backend devolvió en su
 * envoltorio `{ error: { message } }`. Si el cuerpo no es legible o no
 * existe (caída de red, respuesta no JSON), lanza el texto neutro.
 */
export async function lanzarErrorHttp(res: Response): Promise<never> {
  const err = await res.json().catch(() => null);
  throw new Error(err?.error?.message || ERROR_SIN_RESPUESTA);
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
