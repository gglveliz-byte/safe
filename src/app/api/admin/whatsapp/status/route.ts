/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Estado de Conexión de WhatsApp Cloud API (NeuroAPI)
 * ARCHIVO: src/app/api/admin/whatsapp/status/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint administrativo para auditar el estado de configuración de WhatsApp
 * Cloud API mediante NeuroAPI. Verifica si existe una API Key registrada en las
 * variables de entorno del servidor sin revelar secretos en la respuesta.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Protegido estrictamente con requireAdmin.
 * - Runtime Node.js explícito y caché deshabilitada.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, successResponse } from "@/lib/api-response";
import { getNeuroApiKey, listConnectedPhoneNumbers, type ConnectedPhoneNumber } from "@/services/whatsapp.service";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const apiKey = getNeuroApiKey();
    const env = getEnv();

    const isConfigured = Boolean(apiKey && apiKey.length > 5);
    let isConnected = false;
    let officialNumber: ConnectedPhoneNumber | undefined = undefined;

    if (isConfigured) {
      try {
        const numbersRes = await listConnectedPhoneNumbers();
        if (numbersRes.success && numbersRes.numbers.length > 0) {
          const targetId = env.NEUROAPI_PHONE_NUMBER_ID?.trim() || "1331750313364147";
          const matched =
            numbersRes.numbers.find(
              (n) => n.phoneNumberId === targetId || n.phoneNumber.includes("959057138"),
            ) || numbersRes.numbers[0];

          if (matched) {
            isConnected = matched.tokenStatus === "active" || Boolean(matched.phoneNumberId);
            officialNumber = matched;
          }
        }
      } catch {
        // En caso de fallo transitorio en la consulta externa, conservar estado seguro
      }
    }

    return successResponse(
      {
        isConfigured,
        hasPhoneNumberId: Boolean(env.NEUROAPI_PHONE_NUMBER_ID || officialNumber?.phoneNumberId),
        portalUrl: "https://neurochat.com.ec/neuroapi/api-keys",
        isConnected,
        officialNumber,
        webhookUrl: `${env.NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp`,
        hasWebhookSecret: Boolean(env.NEUROAPI_WEBHOOK_SECRET),
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "GET /api/admin/whatsapp/status");
  }
}

