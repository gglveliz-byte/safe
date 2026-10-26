/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Frente Vial Público — Capa de Consumo Tipada de Emergencia
 * ARCHIVO: src/app/emergency/[code]/emergency-api.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Capa de consumo tipada del backend certificado para la vista pública de
 * emergencia (extensión no invasiva aprobada en el Ledger Vivo, Solicitud
 * A1F→A2F). Expone dos operaciones reales contra los Route Handlers de Next.js:
 *   1. fetchEmergencyProfile(code) → GET /api/emergency/{code}
 *      (ficha médica protegida con cédula ofuscada y contactos sin correo).
 *   2. dispatchEmergencyAlert(input) → POST /api/emergency/alert
 *      (despacho de auxilio con GPS del escáner o respaldo del Modo Ruta).
 *
 * ENTRADAS / SALIDAS:
 * - Entrada: folio del casco normalizado y coordenadas opcionales del escáner.
 * - Salida exitosa: campo `data` del sobre `{ success: true, data }`.
 * - Salida fallida: HumanApiError con el mensaje humano en Español que el
 *   backend ya provee (`error.message`), o `null` cuando el fallo es de red
 *   o la respuesta no es reconocible (la vista traduce null a t.common.errorGeneric).
 *
 * DEPENDENCIAS CLAVE:
 * - PublicEmergencyContactDTO (src/components/medical/medical-contact.types.ts).
 * - Contratos congelados en docs/BACKEND_CONTRACTS.md §9.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (objetivo < 380).
 * - Cero datos hardcodeados o demos: PROHIBIDO fabricar alertId, URLs de Maps
 *   o perfiles offline (Ley 2 — el fallback "ALT-OFFLINE" queda erradicado).
 * - Cero jerga técnica visible: sólo se propagan mensajes humanos del backend.
 * ==============================================================================
 */

import type { PublicEmergencyContactDTO } from "@/components/medical/medical-contact.types";

/**
 * Error de transporte cuya única carga útil es un mensaje humano en Español
 * apto para mostrarse a paramédicos y testigos. Cuando `humanMessage` es
 * `null` la vista debe sustituirla por la frase genérica del diccionario
 * (t.common.errorGeneric); nunca se exponen códigos ni tecnicismos.
 */
export class HumanApiError extends Error {
  /** Mensaje humano listo para pantalla, o null si el fallo fue de red/formato. */
  readonly humanMessage: string | null;

  constructor(humanMessage: string | null) {
    super(humanMessage ?? "ERROR_SIN_MENSAJE");
    this.humanMessage = humanMessage;
  }
}

/**
 * Forma exacta y certificada de la respuesta de GET /api/emergency/{code}:
 * estado del dispositivo, ficha médica con cédula ofuscada (PII protegida),
 * contactos de emergencia sin correo electrónico y fecha de última actualización.
 */
export interface PublicEmergencyProfileDTO {
  device: {
    code: string;
    status: "UNCLAIMED" | "ACTIVE" | "DISABLED";
  };
  profile: {
    fullName: string;
    nationalIdMasked: string;
    birthDate: string | null;
    bloodType: string;
    allergies: string | null;
    chronicConditions: string | null;
    medications: string | null;
    insuranceInfo: string | null;
    emergencyNumber: string | null;
    photoUrl: string;
    emergencyContacts: PublicEmergencyContactDTO[];
  };
  updatedAt: string;
}

/** Sobre de éxito congelado del backend: `{ success: true, data }`. */
interface ApiEnvelopeSuccess<T> {
  success: true;
  data: T;
}

/** Sobre de error congelado del backend: `{ success: false, error: { message } }`. */
interface ApiEnvelopeError {
  success: false;
  error: { code?: string; message?: string; details?: unknown };
}

/**
 * Desenvuelve el sobre canónico del backend sobre una respuesta HTTP.
 * - Éxito (`success: true`) → retorna `data` tipado.
 * - Error con mensaje humano no vacío → lanza HumanApiError(message).
 * - Error sin mensaje utilizable o cuerpo ilegible → lanza HumanApiError(null).
 *
 * @param response Respuesta cruda del fetch (cualquier estado HTTP).
 * @returns El campo `data` del sobre cuando la operación fue exitosa.
 */
async function unwrapEnvelope<T>(response: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    // Cuerpo ilegible (no es contenido válido): error sin mensaje humano.
    throw new HumanApiError(null);
  }

  if (payload !== null && typeof payload === "object" && "success" in payload) {
    if ((payload as { success: boolean }).success === true) {
      return (payload as ApiEnvelopeSuccess<T>).data;
    }
    const message = (payload as ApiEnvelopeError).error?.message;
    throw new HumanApiError(
      typeof message === "string" && message.trim() !== "" ? message : null,
    );
  }

  // Estructura desconocida: nunca se fabrican datos (Ley 2).
  throw new HumanApiError(null);
}

/**
 * Consulta la ficha médica pública del casco escaneado.
 * Ruta real: GET /api/emergency/{code} con folio codificado para URL y
 * caché deshabilitada (la ficha debe reflejar siempre el registro vivo).
 *
 * @param code Folio del casco (ej. SAFE-0042) ya normalizado por la vista.
 * @returns Ficha médica protegida certificada por el backend.
 * @throws HumanApiError con mensaje humano del backend, o null si falla la red.
 */
export async function fetchEmergencyProfile(
  code: string,
): Promise<PublicEmergencyProfileDTO> {
  let response: Response;
  try {
    response = await fetch(
      `/api/emergency/${encodeURIComponent(code.trim().toUpperCase())}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );
  } catch {
    // Fallo de red (sin conexión, bloqueo del navegador, etc.).
    throw new HumanApiError(null);
  }
  return unwrapEnvelope<PublicEmergencyProfileDTO>(response);
}

/** Método de lectura del casco reportado por el gateway público (?v=). */
export type ScanSource = "nfc" | "qr" | "direct";

/**
 * Entrada del despacho de alerta médica. Las coordenadas son opcionales:
 * si el permiso de ubicación fue denegado se omiten por completo y el
 * backend utiliza la última posición conocida del piloto (Modo Ruta).
 */
export interface DispatchAlertInput {
  code: string;
  latitude?: number;
  longitude?: number;
  scanSource: ScanSource;
  accuracy?: number;
}

/**
 * Resultado certificado del despacho de alerta: folio real del aviso,
 * coordenada sexagesimal DMS, enlace oficial a Google Maps, conteo de
 * correos entregados y marca de ventana de protección activa (anti-spam).
 */
export interface DispatchAlertResult {
  alertId: string;
  dmsFormatted: string;
  googleMapsUrl: string;
  locationOrigin?: string;
  emailsSentCount: number;
  wasThrottled: boolean;
  createdAt: string;
}

/**
 * Despacha la alerta médica real tras el escaneo del casco.
 * Ruta real: POST /api/emergency/alert con el cuerpo JSON exacto
 * { code, latitude?, longitude?, scanSource, accuracy? } — las claves
 * con valor undefined se OMITEN para satisfacer el esquema estricto.
 *
 * @param input Folio, coordenadas opcionales del escáner y método de lectura.
 * @returns Resultado del despacho (alertId real emitido por el backend).
 * @throws HumanApiError con mensaje humano del backend, o null si falla la red.
 */
export async function dispatchEmergencyAlert(
  input: DispatchAlertInput,
): Promise<DispatchAlertResult> {
  // Construcción del cuerpo exacto: sólo claves con valor definido.
  const payload: Record<string, string | number> = {
    code: input.code.trim().toUpperCase(),
    scanSource: input.scanSource,
  };
  if (input.latitude !== undefined && input.longitude !== undefined) {
    payload.latitude = input.latitude;
    payload.longitude = input.longitude;
  }
  if (input.accuracy !== undefined) {
    payload.accuracy = input.accuracy;
  }

  let response: Response;
  try {
    response = await fetch("/api/emergency/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });
  } catch {
    // Fallo de red: la vista mostrará la frase genérica del diccionario.
    throw new HumanApiError(null);
  }
  return unwrapEnvelope<DispatchAlertResult>(response);
}
