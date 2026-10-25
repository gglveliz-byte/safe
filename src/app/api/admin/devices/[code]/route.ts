/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Eliminación de Chip Físico (Device)
 * ARCHIVO: src/app/api/admin/devices/[code]/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para eliminar un chip físico del sistema y liberar
 * al motociclista que lo tenía vinculado (DELETE /api/admin/devices/:code).
 *
 * Protegido con requireAdmin (rol ADMIN o clave x-admin-key).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Parámetros Next.js 15 (context.params as Promise).
 * - Cero datos hardcodeados o mocks de demostración.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { deleteDeviceByCode } from "@/services/admin-riders.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const { code } = await context.params;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      throw new Error("Código de dispositivo inválido.");
    }

    const result = await deleteDeviceByCode(code.trim().toUpperCase());

    return successResponse(
      {
        success: result.success,
        notFound: result.notFound,
        message: result.message,
      },
      result.notFound ? 404 : 200,
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/devices/:code");
  }
}
