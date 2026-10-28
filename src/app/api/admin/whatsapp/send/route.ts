/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Despacho de Notificación WhatsApp por Plantilla
 * ARCHIVO: src/app/api/admin/whatsapp/send/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para despachar una notificación oficial por WhatsApp
 * mediante una plantilla aprobada por Meta (NeuroAPI). Valida estrictamente
 * los parámetros de entrada con Zod, formatea el teléfono a E.164 y retorna
 * el identificador wamid oficial devuelto por Meta Graph API.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Protegido estrictamente con requireAdmin.
 * - Runtime Node.js explícito y caché deshabilitada.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, parseJsonBody, successResponse, AppError } from "@/lib/api-response";
import { sendWhatsAppNotification } from "@/services/whatsapp.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SendWhatsAppSchema = z
  .object({
    to: z
      .string({ required_error: "El teléfono destinatario es obligatorio." })
      .min(8, "El teléfono debe tener al menos 8 dígitos en formato internacional.")
      .max(20, "El teléfono no puede superar los 20 caracteres."),
    templateName: z
      .string({ required_error: "El nombre de la plantilla de Meta es obligatorio." })
      .min(1, "Debe seleccionar una plantilla válida."),
    languageCode: z.string().optional().default("es"),
    bodyParameters: z.array(z.string()).optional().default([]),
    customKey: z.string().optional(),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const input = await parseJsonBody(request, SendWhatsAppSchema);

    const result = await sendWhatsAppNotification(
      {
        to: input.to,
        templateName: input.templateName,
        languageCode: input.languageCode,
        bodyParameters: input.bodyParameters,
      },
      input.customKey,
    );

    if (!result.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        result.error || "Fallo al despachar mensaje con NeuroAPI",
        400,
      );
    }

    return successResponse(
      {
        messageId: result.messageId,
        status: result.status,
        sent: true,
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "POST /api/admin/whatsapp/send");
  }
}

