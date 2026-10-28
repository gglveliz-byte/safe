/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Generación de Sesión de Conexión Meta WhatsApp (Coexistencia)
 * ARCHIVO: src/app/api/admin/whatsapp/connect/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para iniciar la sesión oficial de conexión con Meta
 * Embedded Signup v4 a través de NeuroAPI. Devuelve una URL segura donde el
 * administrador puede conectar su número telefónico en modo Coexistencia
 * (usando WhatsApp Business en el móvil y la Cloud API en paralelo).
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
import { createWhatsAppConnectSession } from "@/services/whatsapp.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const body = (await request.json().catch(() => ({}))) as { returnUrl?: string };
    const defaultReturnUrl = new URL("/admin", request.url).toString();
    const returnUrl = body.returnUrl || defaultReturnUrl;

    const result = await createWhatsAppConnectSession(returnUrl);

    if (!result.success || !result.url) {
      throw new AppError(
        "SERVER_ERROR",
        result.error || "No se pudo generar la sesión de conexión con Meta WhatsApp.",
        502,
      );
    }

    return successResponse({ url: result.url }, 200);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/whatsapp/connect");
  }
}
