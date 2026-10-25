/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Consumo HTTP Tipado (co-ubicado en su ruta)
 * ARCHIVO: src/app/activate/[code]/activate-api.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Cliente delgado del endpoint certificado `POST /api/devices/activate`
 * (contrato §9 de docs/BACKEND_CONTRACTS.md). Envía un JSON PLANO idéntico al
 * que exige `ActivateDeviceSchema` (`.strict()`: cualquier clave extra o carga
 * anidada es rechazada), desenvuelve el envoltorio congelado
 * `{ success: true, data }` y traduce todo fallo a un `HumanApiError` que
 * transporta el mensaje humano que el propio backend redactó en español
 * ("El PIN de activación es incorrecto.", "Has superado el número de intentos…",
 * "El correo ya está registrado."), listo para exhibirse sin transformación.
 *
 * ENTRADAS: ActivateKitPayload (folio, PIN, cuenta, ficha médica plana,
 *           contactos con UUID y consentimiento explícito).
 * SALIDAS:  ActivateKitResult ({ redirect, deviceCode, user }) o HumanApiError.
 *
 * DEPENDENCIAS CLAVE: EmergencyContactFormDTO
 * (src/components/medical/medical-contact.types.ts, custodiado por F-03).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero mocks, cero fallbacks, cero datos fabricados: si el servicio no
 *   responde con la forma esperada se lanza HumanApiError(null) y la vista
 *   completa con la clave genérica del diccionario (t.common.errorGeneric).
 * - Cabecera canónica y comentarios en español.
 * ==============================================================================
 */

import type { EmergencyContactFormDTO } from "@/components/medical/medical-contact.types";

/**
 * Error de la capa de consumo con mensaje humano apto para la vista.
 * `humanMessage` contiene el texto exacto que el backend certificado redactó;
 * cuando vale null (caída de red, respuesta ilegible o forma inesperada) la
 * página coloca la clave genérica del diccionario. CERO mensajes inventados.
 */
export class HumanApiError extends Error {
  /** Mensaje humano del backend o null cuando no existe ninguno legible. */
  readonly humanMessage: string | null;

  constructor(humanMessage: string | null) {
    super(humanMessage ?? "ERROR_SIN_MENSAJE");
    this.humanMessage = humanMessage;
  }
}

/**
 * Carga PLANA de activación del kit, espejo fiel de ActivateDeviceSchema §7.
 * No existe `medicalData` anidado: el esquema real del backend es estricto y
 * cada campo clínico viaja en la raíz del JSON junto al consentimiento legal.
 */
export interface ActivateKitPayload {
  /** Folio del casco grabado en NFC/QR (ya normalizado a mayúsculas). */
  code: string;
  /** PIN confidencial de 6 dígitos impreso en la tarjeta del empaque. */
  activationPin: string;
  /** Correo de la nueva cuenta del motociclista. */
  email: string;
  /** Contraseña de la cuenta (mínimo 8 caracteres). */
  password: string;
  /** Nombre completo del conductor. */
  fullName: string;
  /** Cédula o documento de identidad del conductor. */
  nationalId: string;
  /** URL real (https) de la fotografía subida al servicio seguro de medios. */
  photoUrl: string;
  /** Identificador público del asset fotográfico; opcional. */
  photoPublicId?: string;
  /** Grupo sanguíneo del catálogo canónico (incluye DESCONOCIDO). */
  bloodType: string;
  /** Alergias conocidas; opcional (máx. 500 caracteres). */
  allergies?: string;
  /** Padecimientos crónicos; opcional (máx. 500 caracteres). */
  chronicConditions?: string;
  /** Medicamentos en uso; opcional (máx. 500 caracteres). */
  medications?: string;
  /** Aseguradora o póliza; opcional (máx. 200 caracteres). */
  insuranceInfo?: string;
  /** Contactos de emergencia con id UUID real generado en el cliente. */
  emergencyContacts: EmergencyContactFormDTO[];
  /** Consentimiento legal vinculante: solo el literal true es aceptado. */
  termsAccepted: true;
  /** Idioma preferido para los correos de alerta (ES/EN). */
  locale?: "es" | "en";
}

/**
 * Resultado certificado de la activación (HTTP 201, `data` del envoltorio):
 * destino de redirección, folio real activado e identidad de la nueva cuenta.
 */
export interface ActivateKitResult {
  redirect: string;
  deviceCode: string;
  user: { id: string; email: string; role: string };
}

/**
 * Convierte la carga tipada en un objeto JSON puro PLANO omitiendo toda clave
 * con valor undefined: el esquema del backend es `.strict()` y la presencia de
 * claves opcionales sin valor (photoPublicId, alergias, idioma…) provocaría un
 * rechazo innecesario. Los contactos también se aplanan campo por campo.
 */
function buildFlatBody(payload: ActivateKitPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    code: payload.code,
    activationPin: payload.activationPin,
    email: payload.email,
    password: payload.password,
    fullName: payload.fullName,
    nationalId: payload.nationalId,
    photoUrl: payload.photoUrl,
    bloodType: payload.bloodType,
    emergencyContacts: payload.emergencyContacts.map((contact) => {
      const flatContact: Record<string, unknown> = {
        id: contact.id,
        name: contact.name,
        relation: contact.relation,
        phone: contact.phone,
        email: contact.email,
      };
      if (contact.isPrimary !== undefined) {
        flatContact.isPrimary = contact.isPrimary;
      }
      return flatContact;
    }),
    termsAccepted: payload.termsAccepted,
  };

  // Claves opcionales: solo viajan cuando el motociclista las declaró.
  if (payload.photoPublicId !== undefined) body.photoPublicId = payload.photoPublicId;
  if (payload.allergies !== undefined) body.allergies = payload.allergies;
  if (payload.chronicConditions !== undefined) body.chronicConditions = payload.chronicConditions;
  if (payload.medications !== undefined) body.medications = payload.medications;
  if (payload.insuranceInfo !== undefined) body.insuranceInfo = payload.insuranceInfo;
  if (payload.locale !== undefined) body.locale = payload.locale;

  return body;
}

/**
 * Activa el kit físico contra el backend certificado.
 * - Éxito (201, `{ success: true, data }`): devuelve `data` tipado.
 * - Fallo conocido (!ok): lanza HumanApiError con `error.message` del backend.
 * - Red caída o respuesta ilegible: lanza HumanApiError(null); la vista coloca
 *   la clave genérica del diccionario. Jamás se fabrica un resultado.
 */
export async function activateKit(payload: ActivateKitPayload): Promise<ActivateKitResult> {
  let response: Response;
  try {
    response = await fetch("/api/devices/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(buildFlatBody(payload)),
    });
  } catch {
    // Sin conexión con el centro de auxilio: mensaje null, cero invención.
    throw new HumanApiError(null);
  }

  let envelope: unknown = null;
  try {
    envelope = await response.json();
  } catch {
    envelope = null;
  }

  const record = (envelope ?? {}) as {
    success?: boolean;
    data?: unknown;
    error?: { message?: unknown };
  };

  if (response.ok && record.success === true && record.data) {
    return record.data as ActivateKitResult;
  }

  const backendMessage = record.error?.message;
  throw new HumanApiError(
    typeof backendMessage === "string" && backendMessage.trim().length > 0
      ? backendMessage
      : null,
  );
}
