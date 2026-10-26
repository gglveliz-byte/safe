/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Utilidades de Cliente — Fábrica de Hardware NFC/QR
 * ARCHIVO: src/lib/nfc-write-utils.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Utilidades puras de cliente para la codificación, formateo a fábrica y vista
 * previa QR de chips NFC para cascos.
 * 1. Resuelve la URL canónica del gateway sin dominios hardcodeados.
 * 2. Genera códigos QR vectoriales locales con la librería `qrcode` sin dependencias externas.
 * 3. Detecta el entorno de ejecución (Android vs iOS vs Desktop) para guiar al operario.
 * 4. Ejecuta el formateo/limpieza a fábrica de chips NDEF regrabables.
 * 5. Mapea errores de hardware (incluyendo chips sellados como sólo lectura).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Cero dominios o datos hardcodeados.
 * ==============================================================================
 */

import QRCode from "qrcode";
import type { AdminDeviceItem } from "@/lib/api-client";

/**
 * Forma extendida de la respuesta de PATCH /api/admin/encode-nfc.
 */
export type EncodeNfcResult = {
  success: boolean;
  device?: Partial<AdminDeviceItem>;
};

export interface NdefReadingEventLike {
  serialNumber: string;
}

export interface NdefReaderLike {
  scan: () => Promise<void>;
  write: (message: {
    records: Array<{ recordType: string; data?: string }>;
  }) => Promise<void>;
  makeReadOnly?: () => Promise<void>;
  onreading: ((event: NdefReadingEventLike) => void) | null;
  onreadingerror?: ((error: unknown) => void) | null;
}

/**
 * Resuelve la URL base pública canónica de la plataforma.
 * Prioridad: NEXT_PUBLIC_APP_URL. Respaldo dinámico en el origen actual.
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
 * Si se pasa `pin`, se adjunta en el querystring para auto-asignación del kit virgen.
 */
export function buildHelmetGatewayClientUrl(
  code: string,
  source: "nfc" | "qr",
  pin?: string,
): string {
  const cleanCode = encodeURIComponent(code.trim().toUpperCase());
  const pinParam = pin ? `&pin=${encodeURIComponent(pin.trim())}` : "";
  return `${resolvePublicBaseUrl()}/r/${cleanCode}?v=${source}${pinParam}`;
}

/**
 * Genera el código QR visual oficial de rescate del kit localmente en Data URL.
 */
export async function generateLocalQrDataUrl(
  code: string,
  size = 200,
  pin?: string,
): Promise<string> {
  const url = buildHelmetGatewayClientUrl(code, "qr", pin);
  return await QRCode.toDataURL(url, {
    margin: 1,
    width: size,
    color: {
      dark: "#0B1F3A",
      light: "#FFFFFF",
    },
  });
}

/**
 * Genera un código QR con la URL del panel de administración para abrirlo en móvil.
 */
export async function generateAdminUrlQr(
  path = "/admin",
  size = 180,
): Promise<string> {
  const base = resolvePublicBaseUrl();
  const fullUrl = `${base}${path}`;
  return await QRCode.toDataURL(fullUrl, {
    margin: 1,
    width: size,
    color: {
      dark: "#0B1F3A",
      light: "#FFFFFF",
    },
  });
}

/**
 * Detecta si el navegador y sistema operativo actual soportan Web NFC.
 * Web NFC únicamente está disponible en Google Chrome sobre Android.
 */
export function detectNfcEnvironment(): {
  isSupported: boolean;
  isAndroid: boolean;
  isIos: boolean;
  isDesktop: boolean;
} {
  if (typeof window === "undefined") {
    return { isSupported: false, isAndroid: false, isIos: false, isDesktop: false };
  }
  const isSupported = "NDEFReader" in window;
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isDesktop = !isAndroid && !isIos;
  return { isSupported, isAndroid, isIos, isDesktop };
}

/**
 * Limpia y formatea a fábrica la memoria NDEF de un chip físico reescribible.
 * Si el chip está sellado con lock bits por hardware, captura NotAllowedError.
 */
export async function wipeNfcPhysicalChip(ndef: {
  write: (msg: { records: Array<{ recordType: string; data?: string }> }) => Promise<void>;
}): Promise<{ success: boolean; isLocked?: boolean; error?: string }> {
  try {
    // Intento 1: Registro vacío estándar W3C NDEF
    await ndef.write({ records: [] });
    return { success: true };
  } catch (err: unknown) {
    const isLocked =
      err instanceof Error &&
      (err.name === "NotAllowedError" ||
        err.message.toLowerCase().includes("read-only"));
    if (isLocked) {
      return { success: false, isLocked: true, error: err instanceof Error ? err.message : "Locked" };
    }

    // Intento 2: Fallback defensivo para chips que exigen al menos un registro NDEF vacío
    try {
      await ndef.write({ records: [{ recordType: "text", data: "" }] });
      return { success: true };
    } catch (fallbackErr: unknown) {
      return {
        success: false,
        isLocked: false,
        error: fallbackErr instanceof Error ? fallbackErr.message : "Wipe failed",
      };
    }
  }
}

/**
 * Mapea los errores de Web NFC a textos inteligibles del diccionario.
 */
export function describeNfcError(
  err: unknown,
  fallback: string,
  lockedFallback?: string,
): string {
  if (
    err instanceof Error &&
    (err.name === "NotAllowedError" ||
      err.message?.toLowerCase().includes("read-only"))
  ) {
    return lockedFallback || fallback;
  }
  const name = err instanceof Error && err.name ? err.name : undefined;
  return name ? `${fallback} (${name})` : fallback;
}

/**
 * Fusiona el dispositivo devuelto por el backend sin fabricar estado.
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
