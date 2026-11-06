/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Panel Administrativo — Moderación de Reseñas y Testimonios
 * ARCHIVO: src/app/api/admin/feedback/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para listar, aprobar y descartar comentarios y
 * testimonios de usuarios del servicio.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Protegido estrictamente con requireAdmin.
 * - Validación Zod para mutaciones.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  handleApiError,
  parseJsonBody,
  successResponse,
  AppError,
} from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ToggleApprovalSchema = z.object({
  id: z.string().uuid("ID de comentario inválido."),
  isApproved: z.boolean(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const feedbacks = await db.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return successResponse({
      feedbacks,
      total: feedbacks.length,
      approvedCount: feedbacks.filter((f) => f.isApproved).length,
      pendingCount: feedbacks.filter((f) => !f.isApproved).length,
    });
  } catch (error) {
    return handleApiError(error, "admin.feedback.get");
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const input = await parseJsonBody(request, ToggleApprovalSchema);

    const updated = await db.feedback.update({
      where: { id: input.id },
      data: { isApproved: input.isApproved },
    });

    return successResponse({
      message: input.isApproved
        ? "El testimonio ha sido aprobado para mostrarse en la portada."
        : "El testimonio ha sido ocultado de la portada.",
      feedback: updated,
    });
  } catch (error) {
    return handleApiError(error, "admin.feedback.patch");
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      throw new AppError("VALIDATION_ERROR", "Debe proporcionar el ID del comentario a eliminar.", 400);
    }

    await db.feedback.delete({
      where: { id },
    });

    return successResponse({
      message: "Comentario eliminado exitosamente.",
    });
  } catch (error) {
    return handleApiError(error, "admin.feedback.delete");
  }
}

