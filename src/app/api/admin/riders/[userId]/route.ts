/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Gestión y Eliminación de Usuario Registrado
 * ARCHIVO: src/app/api/admin/riders/[userId]/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para:
 * 1. Activar o desactivar una cuenta (PATCH /api/admin/riders/:userId).
 * 2. Eliminar un usuario registrado y su chip vinculado de manera atómica
 *    (DELETE /api/admin/riders/:userId).
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
import { z } from "zod";
import {
  handleApiError,
  successResponse,
  errorResponse,
  parseJsonBody,
  AppError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import {
  deleteRegisteredUser,
  setUserActiveStatus,
} from "@/services/admin-riders.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const UpdateRiderStatusSchema = z.object({
  isActive: z.boolean({
    required_error: "El parámetro isActive es obligatorio.",
  }),
});

/**
 * PATCH /api/admin/riders/:userId
 * Activa o desactiva la cuenta de un motociclista y sincroniza el estado de su chip.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const { userId } = await context.params;

    if (!UUID_PATTERN.test(userId)) {
      throw new AppError("VALIDATION_ERROR", "Identificador de usuario inválido.", 400);
    }

    const body = await parseJsonBody(request, UpdateRiderStatusSchema);
    const result = await setUserActiveStatus(userId, body.isActive);

    if (result.notFound) {
      return errorResponse("NOT_FOUND", result.message, 404);
    }

    return successResponse(
      {
        success: result.success,
        isActive: result.isActive,
        message: result.message,
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/riders/:userId");
  }
}

/**
 * DELETE /api/admin/riders/:userId
 * Elimina definitivamente un usuario y su chip vinculado en una transacción atómica.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const { userId } = await context.params;

    if (!UUID_PATTERN.test(userId)) {
      throw new AppError("VALIDATION_ERROR", "Identificador de usuario inválido.", 400);
    }

    const result = await deleteRegisteredUser(userId);

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
