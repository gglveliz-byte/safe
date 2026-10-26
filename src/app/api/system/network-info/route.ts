/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Sistema — Detección Dinámica de Red Local / VPS para Hardware NFC & QR
 * ARCHIVO: src/app/api/system/network-info/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint GET que detecta automáticamente las interfaces de red del servidor
 * (IP de red local Wi-Fi / Ethernet en desarrollo y puerto activo) así como la
 * URL canónica configurada en NEXT_PUBLIC_APP_URL.
 * Permite que los módulos de hardware (plancha QR y grabador NFC) determinen
 * de forma dinámica e inteligente la URL base accesible por dispositivos móviles.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 80 líneas).
 * - Cero dependencias pesadas, consumo directo de módulo nativo `os`.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");

  // Extracción del host solicitado en la petición actual (ej. si entraron por IP o VPS)
  const reqHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const reqProto = request.headers.get("x-forwarded-proto") || "http";
  const requestOrigin = reqHost ? `${reqProto}://${reqHost}` : "";

  // Detección de la IP de red local (Wi-Fi / Ethernet)
  let detectedLanIp = "";
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    if (!list) continue;
    for (const net of list) {
      if (net.family === "IPv4" && !net.internal) {
        detectedLanIp = net.address;
        break;
      }
    }
    if (detectedLanIp) break;
  }

  // Deducción de puerto
  const port = process.env.PORT || "3000";
  const lanUrl = detectedLanIp ? `http://${detectedLanIp}:${port}` : "";

  return NextResponse.json({
    success: true,
    data: {
      lanIp: detectedLanIp,
      lanUrl,
      envUrl,
      requestOrigin,
    },
  });
}
