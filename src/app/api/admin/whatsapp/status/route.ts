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
    let metaAlert: { title: string; message: string; actionUrl: string; actionLabel: string } | undefined = undefined;

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

      // Consulta de auditoría de salud y límites en Meta Cloud API
      try {
        if (apiKey) {
          const limitsRes = await fetch("https://api.neurochat.com.ec/api/v1/neuroapi/messaging/numbers/default/limits", {
            headers: { "x-api-key": apiKey },
            cache: "no-store",
          });
          if (limitsRes.ok) {
            const limitsJson = await limitsRes.json();
            const firstAlert = limitsJson.data?.alerts?.[0];
            if (firstAlert) {
              metaAlert = {
                title: String(firstAlert.title || "Aviso de Meta Cloud API"),
                message: String(firstAlert.message || ""),
                actionUrl: String(firstAlert.actionUrl || "https://business.facebook.com/billing"),
                actionLabel: String(firstAlert.actionLabel || "Configurar en Meta"),
              };
            }
          }
        }
      } catch {
        // En caso de fallo transitorio, continuar
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
        isWebhookLinked: true,
        metaAlert,
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "GET /api/admin/whatsapp/status");
  }
}

