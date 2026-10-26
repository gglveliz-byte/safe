/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Eliminación de Lote Completo de Chips
 * ARCHIVO: src/app/api/admin/batches/[batchName]/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para eliminar un lote completo de chips de forma
 * atómica (DELETE /api/admin/batches/:batchName).
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
import { deleteBatchByName } from "@/services/batch.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ batchName: string }> },
): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const { batchName } = await context.params;

    if (!batchName || typeof batchName !== "string" || batchName.trim().length === 0) {
      throw new Error("Nombre de lote inválido.");
    }

    const decodedName = decodeURIComponent(batchName.trim());
    const result = await deleteBatchByName(decodedName);

    return successResponse(result, 200);
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/batches/:batchName");
  }
}
