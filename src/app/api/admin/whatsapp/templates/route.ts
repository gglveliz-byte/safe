/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Consulta de Plantillas Oficiales de WhatsApp
 * ARCHIVO: src/app/api/admin/whatsapp/templates/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para obtener la lista de plantillas oficiales de Meta
 * Graph API aprobadas en NeuroAPI. Permite auditar qué plantillas existen, sus
 * categorías (UTILITY, MARKETING, etc.), idiomas y variables para asociarlas
 * a las alertas de emergencia de SAFE.
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
import { listWhatsAppTemplates } from "@/services/whatsapp.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    // Permite probar una API key ingresada en el modal antes de persistirla
    const { searchParams } = new URL(request.url);
    const customKey = searchParams.get("customKey") || request.headers.get("x-custom-api-key") || undefined;

    const result = await listWhatsAppTemplates(customKey);

    if (!result.success) {
      throw new AppError("VALIDATION_ERROR", result.error || "Fallo al consultar plantillas en NeuroAPI", 400);
    }

    return successResponse(
      {
        stats: result.stats,
        templates: result.templates,
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "GET /api/admin/whatsapp/templates");
  }
}

