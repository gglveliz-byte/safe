/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Consulta de Números Oficiales de WhatsApp Conectados
 * ARCHIVO: src/app/api/admin/whatsapp/numbers/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para obtener la lista de números de teléfono oficiales
 * conectados a la cuenta de NeuroAPI (Meta Cloud API). Permite al administrador
 * seleccionar qué número específico consultar para evitar mezclar plantillas
 * entre diferentes líneas o WABAs.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Protegido estrictamente con requireAdmin.
 * - Runtime Node.js explícito y caché deshabilitada.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, successResponse, AppError } from "@/lib/api-response";
import { listConnectedPhoneNumbers } from "@/services/whatsapp.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const customKey = searchParams.get("customKey") || request.headers.get("x-custom-api-key") || undefined;

    const result = await listConnectedPhoneNumbers(customKey);

    if (!result.success) {
      throw new AppError("VALIDATION_ERROR", result.error || "Fallo al consultar números en NeuroAPI", 400);
    }

    return successResponse(
      {
        numbers: result.numbers,
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "GET /api/admin/whatsapp/numbers");
  }
}

