/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: API Administrativa — Parámetros Globales del Sistema
 * ARCHIVO: src/app/api/admin/settings/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint protegido para Administradores (GET/POST /api/admin/settings).
 * Permite consultar y actualizar los parámetros de operación del sistema,
 * específicamente el "Modo Entrega Asistida de PIN" y el correo destinatario.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 100 líneas).
 * - Cero mocks: integración directa con Neon PostgreSQL vía settings.service.
 * - Validación Zod estricta y protección requireAdmin (JWT firmado).
 * - Cabecera y comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import {
  handleApiError,
  parseJsonBody,
  successResponse,
} from "@/lib/api-response";
import {
  getAdminPinDispatchConfig,
  setAdminPinDispatchConfig,
} from "@/services/settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AdminSettingsSchema = z.object({
  enabled: z.boolean(),
  notificationEmail: z
    .string()
    .trim()
    .email("El formato del correo de notificación no es válido.")
    .optional()
    .or(z.literal("")),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const config = await getAdminPinDispatchConfig();
    return successResponse(config);
  } catch (error) {
    return handleApiError(error, "admin.settings.get");
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const input = await parseJsonBody(request, AdminSettingsSchema);

    await setAdminPinDispatchConfig(
      input.enabled,
      input.notificationEmail ?? "",
    );

    return successResponse({
      success: true,
      message: "Configuración administrativa actualizada exitosamente.",
      config: {
        enabled: input.enabled,
        notificationEmail: (input.notificationEmail ?? "").trim(),
      },
    });
  } catch (error) {
    return handleApiError(error, "admin.settings.post");
  }
}
