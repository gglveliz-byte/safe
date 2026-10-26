/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Purga Completa de Datos (Riders y Chips)
 * ARCHIVO: src/app/api/admin/purge/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para vaciar y purgar todos los datos de pruebas:
 * elimina todos los motociclistas registrados (RIDER), perfiles médicos,
 * alertas y chips físicos de PostgreSQL. Conserva las cuentas con rol ADMIN.
 *
 * Protegido con requireAdmin (rol ADMIN o clave x-admin-key).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { purgeAllRidersAndDevices } from "@/services/admin-riders.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const result = await purgeAllRidersAndDevices();
    return successResponse(result, 200);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/purge");
  }
}
