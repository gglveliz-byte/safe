/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Consulta de Usuarios Registrados con Chips
 * ARCHIVO: src/app/api/admin/riders/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint de solo lectura para la consola administrativa. Devuelve los
 * motociclistas reales registrados en PostgreSQL junto con el chip SAFE que
 * cada uno tiene vinculado. Exige sesión con rol ADMIN (o clave maestra
 * x-admin-key validada por requireAdmin).
 *
 * GET: { riders: AdminRiderRecord[] } ordenado del alta más reciente al más
 * antigua. No expone PINs, contraseñas, datos clínicos ni cédulas.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Runtime Node.js explícito, caché deshabilitada y errores auditados.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { listRegisteredRiders } from "@/services/admin-riders.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Devuelve los usuarios RIDER con su chip vinculado para el panel de admin.
 * @param request Petición entrante con cookie HttpOnly de sesión ADMIN.
 * @returns JSON { success, data: { riders } } con Cache-Control: no-store.
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
