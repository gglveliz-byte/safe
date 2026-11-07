/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Webhooks — Endpoint Inbound de WhatsApp Business Cloud (NeuroAPI)
 * ARCHIVO: src/app/api/webhook/whatsapp/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint receptor de webhooks para la integración oficial de WhatsApp Cloud API
 * vía NeuroAPI.
 *
 * MÉTODOS SOPORTADOS:
 * 1. GET: Handshake de verificación de Meta / NeuroAPI. Valida hub.mode y
 *    hub.verify_token contra NEUROAPI_WEBHOOK_SECRET y retorna hub.challenge con
 *    HTTP 200.
 * 2. POST: Recepción de eventos en segundo plano (mensajes entrantes de clientes,
 *    respuestas familiares y actualizaciones de entrega: sent, delivered, read,
 *    failed). Valida la firma criptográfica HMAC-SHA256 (X-Hub-Signature-256)
 *    contra el cuerpo crudo (raw body) antes de procesar el payload.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Respuesta rápida HTTP 200 ("EVENT_RECEIVED") para evitar reintentos de Meta.
 * ==============================================================================
 */

import { NextRequest } from "next/server";
import { logEvent } from "@/lib/logger";
import {
  verifyMetaHandshake,
  verifyWebhookSignature,
  processWhatsAppWebhookPayload,
  type WhatsAppWebhookPayload,
} from "@/services/whatsapp-webhook.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/webhook/whatsapp
 * Verificación del webhook (Meta Webhook Handshake).
 */
export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const check = verifyMetaHandshake(mode, verifyToken, challenge);

  if (!check.isValid) {
    logEvent("warn", "Fallo en apretón de manos de webhook de WhatsApp", {
      mode,
      error: check.error,
    });

    return new Response(check.error || "Forbidden", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  logEvent("info", "Apretón de manos de webhook de WhatsApp completado con éxito", {
    mode,
  });

  return new Response(check.challenge || "", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * POST /api/webhook/whatsapp
 * Recepción y validación HMAC de eventos entrantes de WhatsApp.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let rawBody = "";

  try {
    rawBody = await request.text();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logEvent("error", "Error al leer rawBody de webhook de WhatsApp", { error: errorMsg });
    return new Response("No se pudo leer el cuerpo de la solicitud", { status: 400 });
  }

  // Extraer encabezado de firma de Meta / NeuroAPI
  const signature =
    request.headers.get("x-hub-signature-256") ||
    request.headers.get("X-Hub-Signature-256");

  // Validación de firma criptográfica HMAC-SHA256
  const sigCheck = verifyWebhookSignature(rawBody, signature);
  if (!sigCheck.isValid) {
    logEvent("warn", "Rechazo de webhook WhatsApp por firma criptográfica inválida", {
      error: sigCheck.error,
      hasSignatureHeader: Boolean(signature),
    });

    return new Response(sigCheck.error || "Firma inválida", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Parseo de payload JSON
  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err: unknown) {
    const parseError = err instanceof Error ? err.message : String(err);
    logEvent("error", "Error al parsear JSON de webhook WhatsApp verificado", {
      error: parseError,
    });
    return new Response("Cuerpo JSON malformado", { status: 400 });
  }

  // Procesamiento estructurado de mensajes y estados
  try {
    const { processedMessages, processedStatuses } = await processWhatsAppWebhookPayload(payload);

    logEvent("info", "Webhook WhatsApp procesado exitosamente", {
      processedMessages,
      processedStatuses,
    });
  } catch (err: unknown) {
    const processingError = err instanceof Error ? err.message : String(err);
    logEvent("error", "Error interno al procesar payload de WhatsApp", {
      error: processingError,
    });
    // Se retorna 200 igualmente para que Meta no sature la cola con reintentos
  }

  // Retornar confirmación estándar según protocolo de Meta
  return new Response("EVENT_RECEIVED", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

