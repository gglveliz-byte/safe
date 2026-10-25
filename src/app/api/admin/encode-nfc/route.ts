/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Grabado Físico y Confirmación de Chip NFC
 * ARCHIVO: src/app/api/admin/encode-nfc/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para confirmar la grabación física del chip NFC
 * NTAG216 adherido al casco (PATCH /api/admin/encode-nfc).
 *
 * Registra el número de serie de fábrica del chip (UID), marca el dispositivo
 * como codificado (isNfcEncoded: true), almacena el estado del switch de bloqueo
 * permanente de solo lectura (isLockedReadOnly) y sella la fecha de codificación
 * en la base de datos PostgreSQL.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { handleApiError, parseJsonBody, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { EncodeNfcSchema } from "@/lib/schemas/admin.schema";
import { encodeNfc } from "@/services/batch.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const input = await parseJsonBody(request, EncodeNfcSchema);

    const device = await encodeNfc(input);

    return successResponse({ device }, 200);
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/encode-nfc");
  }
}
