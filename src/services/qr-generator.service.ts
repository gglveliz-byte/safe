/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Hardware & Auxilio Vial — Generador Local de Códigos QR en Memoria
 * ARCHIVO: src/services/qr-generator.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderizador de códigos QR de alta resolución generado 100% en memoria
 * local mediante el motor vectorial `qrcode`. Genera las URLs canónicas del
 * gateway de casco (/r/[code]), representaciones vectoriales SVG para hojas de
 * impresión técnica industrial de pegatinas de rescate, Data URLs en Base64
 * para visualización en pantalla y buffers binarios PNG para su descarga
 * o almacenamiento directo sin depender de servicios externos de terceros.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero dependencias de APIs externas o servicios en la nube para renderizado.
 * - Generación en memoria pura sin tocar disco.
 * - Comentarios en Español.
 * ==============================================================================
 */

import QRCode from "qrcode";
import { getEnv } from "@/lib/env";

/**
 * Construye la URL pública y canónica del gateway de redirección del casco (/r/[code]).
 *
 * @param code Folio del kit o casco físico (ej. SAFE-0001).
 * @param source Origen físico del escaneo ("nfc", "qr" o "direct").
 * @param baseUrl URL base opcional; si no se provee, se toma NEXT_PUBLIC_APP_URL.
 */
export function buildHelmetGatewayUrl(
  code: string,
  source?: "nfc" | "qr" | "direct",
  baseUrl?: string,
): string {
  const base = baseUrl ? baseUrl.replace(/\/+$/, "") : getEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const cleanCode = encodeURIComponent(code.trim().toUpperCase());
  const path = `${base}/r/${cleanCode}`;

  if (source) {
    return `${path}?v=${source}`;
  }

  return path;
}

/**
 * Genera el código QR en formato vectorial SVG para maquetación e impresión industrial.
 *
 * @param url Enlace de destino que codificará el código QR.
 */
export async function generateQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Genera el código QR como Data URL de imagen PNG (data:image/png;base64,...).
 *
 * @param url Enlace de destino que codificará el código QR.
 */
export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    type: "image/png",
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Genera el código QR como un Buffer binario de imagen PNG.
 *
 * @param url Enlace de destino que codificará el código QR.
 */
export async function generateQrPngBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
