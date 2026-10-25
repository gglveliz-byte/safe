/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Listado de Motociclistas y Chips
 * ARCHIVO: src/app/api/admin/riders/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para consultar los motociclistas registrados con sus
 * respectivos kits/chips vinculados en la plataforma.
 *
 * Protegido con requireAdmin (acepta cookie con rol ADMIN o clave maestra
 * x-admin-key). No expone datos sensibles: datos médicos protegidos.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Runtime Node.js explícito, caché deshabilitada, errores auditados.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { listRegisteredRiders } from "@/services/admin-riders.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Consulta la lista de todos los usuarios registrados con rol RIDER.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const riders = await listRegisteredRiders();
    return successResponse({ riders }, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/riders");
  }
}
