/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Eliminación de Usuario Registrado
 * ARCHIVO: src/app/api/admin/riders/[userId]/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para eliminar un usuario registrado y su chip
 * vinculado de manera atómica (DELETE /api/admin/riders/:userId).
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
import { deleteRegisteredUserWithDevice } from "@/services/admin-riders.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const { userId } = await context.params;

    const UUID_PATTERN =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_PATTERN.test(userId)) {
      throw new Error("Identificador de usuario inválido.");
    }

    const result = await deleteRegisteredUserWithDevice(userId);

    return successResponse(
      {
        success: result.success,
        notFound: result.notFound,
        message: result.message,
      },
      result.notFound ? 404 : 200,
    );
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/riders/:userId");
  }
}
