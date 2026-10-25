/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Utilidades de Cliente — Fábrica de Hardware NFC/QR
 * ARCHIVO: src/lib/nfc-write-utils.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Utilidades puras de cliente para la codificación de chips NFC y la plancha
 * de impresión QR. Resuelven la URL canónica del gateway del casco sin dominios
 * hardcodeados (NEXT_PUBLIC_APP_URL con respaldo dinámico en el origen actual
 * del navegador), construyen UIDs hexadecimales simulados con formato idéntico
 * al de un NTAG216 real, fusionan el dispositivo real devuelto por
 * PATCH /api/admin/encode-nfc sin fabricar estados y mapean los errores
 * técnicos de la Web NFC API a texto del diccionario con detalle corto.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Cero dominios o datos hardcodeados.
 * - Compatible con la validación Zod del backend: /^[A-Fa-f0-9:-]+$/ (8-64 caracteres).
 * ==============================================================================
 */

import type { AdminDeviceItem } from "@/lib/api-client";

/**
 * Forma extendida de la respuesta de PATCH /api/admin/encode-nfc.
 * El backend devuelve data.device (code, nfcSerialNumber, isNfcEncoded,
 * isLockedReadOnly, encodedAt — pero NO status); el api-client actual sólo
 * expone { success }, por lo que el campo device se lee de forma defensiva.
 */
export type EncodeNfcResult = {
  success: boolean;
  device?: Partial<AdminDeviceItem>;
};

/**
 * Resuelve la URL base pública canónica de la plataforma.
 * Prioridad: NEXT_PUBLIC_APP_URL (Next.js la hornea como literal en el bundle
 * del cliente en tiempo de compilación). Respaldo dinámico para desarrollo
 * sin .env: el origen actual del navegador. NUNCA un dominio inventado.
 */
export function resolvePublicBaseUrl(): string {
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

/**
 * Construye la URL del gateway del casco (/r/[code]?v=nfc|qr) desde el cliente.
 * Espeja el comportamiento canónico del servicio de servidor
 * qr-generator.service.ts (folio en mayúsculas y codificado).
 */
export function buildHelmetGatewayClientUrl(
  code: string,
  source: "nfc" | "qr",
): string {
  const cleanCode = encodeURIComponent(code.trim().toUpperCase());
  return `${resolvePublicBaseUrl()}/r/${cleanCode}?v=${source}`;
}

/**
 * Genera un UID NFC simulado con formato válido: 7 bytes aleatorios en
 * hexadecimal mayúsculo separados por ":" (idéntico a un NTAG216 real,
 * ej. "04:D4:F1:34:C2:2A:81"). Cumple la validación estricta del backend
 * (/^[A-Fa-f0-9:-]+$/ con mínimo 8 caracteres) usando crypto.getRandomValues.
 */
export function generateSimulatedNfcUid(): string {
  const bytes = Array.from(crypto.getRandomValues(new Uint8Array(7)));
  return bytes
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(":");
}

/**
 * Mapea los errores crudos de la Web NFC API (DOMException con mensajes
 * técnicos en inglés) a un texto del diccionario bilingüe acompañado de un
 * detalle genérico corto (únicamente el nombre de la excepción).
 */
export function describeNfcError(err: unknown, fallback: string): string {
  const name = err instanceof Error && err.name ? err.name : undefined;
  return name ? `${fallback} (${name})` : fallback;
}

/**
 * Fusiona el dispositivo real devuelto por PATCH encode-nfc con el folio
 * local original. Reglas críticas anti-fabricación:
 * - El backend encodeNfc NO cambia el status: el kit sigue UNCLAIMED hasta
 *   su activación con PIN. Nunca se inventa "ACTIVE".
 * - Los campos reales del backend (si existen) tienen prioridad absoluta.
 */
export function buildUpdatedDevice(
  original: AdminDeviceItem,
  backend: Partial<AdminDeviceItem>,
  uid: string,
): AdminDeviceItem {
  return {
    ...original,
    ...backend,
    status: backend.status ?? original.status,
    nfcSerialNumber: backend.nfcSerialNumber ?? uid,
    isNfcEncoded: backend.isNfcEncoded ?? true,
    encodedAt: backend.encodedAt ?? new Date().toISOString(),
  };
}
