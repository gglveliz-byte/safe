/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Fábrica de Lotes de Hardware y Folios
 * ARCHIVO: src/app/api/admin/batches/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para la gestión y fabricación de lotes de cascos físicos.
 * Protegido con requireAdmin (acepta cookie con rol ADMIN o clave maestra x-admin-key).
 *
 * GET: Devuelve la lista agregada de todos los lotes producidos o el detalle
 * individual de cascos de un lote (con opción includePins=true para impresión de tarjetas).
 *
 * POST: Crea un lote de folios secuenciales (SAFE-XXXX) con PINs de activación
 * criptográficos de 6 dígitos mediante transacción atómica en PostgreSQL.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import {
  handleApiError,
  parseJsonBody,
  parseQuery,
  successResponse,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import {
  CreateBatchSchema,
  BatchesQuerySchema,
} from "@/lib/schemas/admin.schema";
import {
  createBatch,
  listBatches,
  getBatchDetail,
} from "@/services/batch.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Consulta la lista de lotes o el detalle específico de un lote para producción.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const query = await parseQuery(request.url, BatchesQuerySchema);

    if (query.batchName) {
      const detail = await getBatchDetail(query.batchName, Boolean(query.includePins));
      return successResponse(detail, 200);
    }

    const batches = await listBatches();
    return successResponse({ batches }, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/batches");
  }
}

/**
 * Genera un nuevo lote de producción de cascos físicos con numeración secuencial.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const input = await parseJsonBody(request, CreateBatchSchema);

    const created = await createBatch(input);

    return successResponse(created, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/batches");
  }
}
