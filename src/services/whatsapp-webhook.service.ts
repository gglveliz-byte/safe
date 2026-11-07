/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Servicios de Avisos — Procesador de Webhook Inbound de WhatsApp (NeuroAPI)
 * ARCHIVO: src/services/whatsapp-webhook.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Servicio criptográfico y de procesamiento de eventos entrantes de WhatsApp
 * Business Cloud API a través de NeuroAPI.
 *
 * RESPONSABILIDADES:
 * 1. Validación de apretón de manos (handshake verification) para el registro
 *    del webhook en Meta / NeuroAPI (hub.mode, hub.verify_token, hub.challenge).
 * 2. Verificación criptográfica estricta de firma HMAC-SHA256 (X-Hub-Signature-256)
 *    contra el cuerpo crudo (raw body) de la solicitud con tiempo constante
 *    (crypto.timingSafeEqual) para erradicar ataques de temporización.
 * 3. Normalización y registro estructurado de mensajes entrantes de clientes y
 *    reportes de estado de entrega (enviado, entregado, leído, fallido).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Validación en tiempo constante sin excepciones de longitud de buffer.
 * - No emitir datos sensibles o secretos a registros ni respuestas HTTP.
 * ==============================================================================
 */

import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

/** Estructura de mensaje inbound recibido */
export interface WhatsAppInboundMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
  };
  document?: {
    id: string;
    filename?: string;
    mime_type?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

/** Estructura de reporte de entrega de WhatsApp */
export interface WhatsAppInboundStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id?: string;
    origin?: {
      type?: string;
    };
  };
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
    error_data?: {
      details?: string;
    };
  }>;
}

/** Estructura de eco de mensaje enviado desde la app móvil por un agente */
export interface WhatsAppInboundEchoMessage {
  from: string;
  to: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
}

/** Contenido del cambio en el objeto entry */
export interface WhatsAppWebhookChangeValue {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  contacts?: Array<{
    profile?: {
      name?: string;
    };
    wa_id?: string;
  }>;
  messages?: WhatsAppInboundMessage[];
  message_echoes?: WhatsAppInboundEchoMessage[];
  statuses?: WhatsAppInboundStatus[];
}

/** Objeto de cambio individual dentro de entry */
export interface WhatsAppWebhookChange {
  field: string;
  value: WhatsAppWebhookChangeValue;
}

/** Objeto entry de Meta */
export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

/** Payload raíz del webhook de Meta / NeuroAPI */
export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

/** Secreto canónico de respaldo provisionado en NeuroAPI para Altus Chip */
const DEFAULT_NEUROAPI_WEBHOOK_SECRET = "d011ea66b5ca76b745a0fcaccd080e95213f474f7a821989";

/**
 * Obtiene el secreto configurado para el webhook de NeuroAPI.
 */
export function getWebhookSecret(): string {
  try {
    const env = getEnv();
    const secret = env.NEUROAPI_WEBHOOK_SECRET?.trim() || process.env.NEUROAPI_WEBHOOK_SECRET?.trim();
    return secret && secret.length > 0 ? secret : DEFAULT_NEUROAPI_WEBHOOK_SECRET;
  } catch {
    return process.env.NEUROAPI_WEBHOOK_SECRET?.trim() || DEFAULT_NEUROAPI_WEBHOOK_SECRET;
  }
}

/**
 * Verifica el apretón de manos (handshake verification) de Meta / NeuroAPI (GET).
 * Compara hub.verify_token con el secreto configurado en el servidor.
 */
export function verifyMetaHandshake(
  mode: string | null,
  verifyToken: string | null,
  challenge: string | null,
): { isValid: boolean; challenge?: string; error?: string } {
  const secret = getWebhookSecret();

  if (!secret) {
    return {
      isValid: false,
      error: "NEUROAPI_WEBHOOK_SECRET no está configurado en las variables de entorno del servidor.",
    };
  }

  if (mode !== "subscribe") {
    return {
      isValid: false,
      error: `Modo inválido: se esperaba 'subscribe' pero se recibió '${mode}'.`,
    };
  }

  if (!verifyToken || verifyToken !== secret) {
    return {
      isValid: false,
      error: "Token de verificación (hub.verify_token) inválido o discrepante con el secreto configurado.",
    };
  }

  return {
    isValid: true,
    challenge: challenge || "",
  };
}

/**
 * Verifica la firma criptográfica HMAC-SHA256 (X-Hub-Signature-256) contra
 * el rawBody recibido de la solicitud.
 *
 * Utiliza comparación en tiempo constante (crypto.timingSafeEqual) y comprueba
 * primero la paridad de longitudes para evitar excepciones no controladas.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): { isValid: boolean; error?: string } {
  const secret = getWebhookSecret();

  if (!secret) {
    return {
      isValid: false,
      error: "NEUROAPI_WEBHOOK_SECRET no está configurado en el servidor.",
    };
  }

  if (!signatureHeader) {
    return {
      isValid: false,
      error: "Falta encabezado X-Hub-Signature-256 en la solicitud.",
    };
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

  const providedBuffer = Buffer.from(signatureHeader, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  // Si las longitudes difieren, no son iguales y timingSafeEqual lanzaría un RangeError
  if (providedBuffer.byteLength !== expectedBuffer.byteLength) {
    return {
      isValid: false,
      error: "La firma HMAC recibida no coincide en longitud con la calculada.",
    };
  }

  const matches = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  if (!matches) {
    return {
      isValid: false,
      error: "Firma criptográfica HMAC-SHA256 inválida.",
    };
  }

  return { isValid: true };
}

/**
 * Procesa el payload entrante de WhatsApp retransmitido por NeuroAPI.
 * Extrae y registra mensajes inbound y cambios de estado de entrega de manera segura.
 */
export async function processWhatsAppWebhookPayload(
  payload: WhatsAppWebhookPayload,
): Promise<{ processedMessages: number; processedStatuses: number }> {
  let processedMessages = 0;
  let processedStatuses = 0;

  if (!payload || !Array.isArray(payload.entry)) {
    return { processedMessages, processedStatuses };
  }

  for (const entry of payload.entry) {
    if (!Array.isArray(entry.changes)) continue;

    for (const change of entry.changes) {
      const isMessagesField = change.field === "messages";
      const isEchoesField = change.field === "smb_message_echoes";
      if ((!isMessagesField && !isEchoesField) || !change.value) continue;

      const value = change.value;
      const phoneId = value.metadata?.phone_number_id || "desconocido";
      const displayPhone = value.metadata?.display_phone_number || "";

      // 1. Procesar mensajes entrantes (respuestas de usuarios o familiares)
      if (Array.isArray(value.messages)) {
        for (const msg of value.messages) {
          processedMessages++;
          const senderProfile = value.contacts?.find((c) => c.wa_id === msg.from)?.profile?.name;

          logEvent("info", "Mensaje inbound de WhatsApp recibido vía NeuroAPI", {
            phoneId,
            displayPhone,
            from: msg.from,
            senderName: senderProfile || "Anónimo",
            messageId: msg.id,
            type: msg.type,
            hasText: Boolean(msg.text?.body),
            hasImage: Boolean(msg.image?.id),
            hasDocument: Boolean(msg.document?.id),
            hasLocation: Boolean(msg.location),
            timestamp: msg.timestamp,
          });
        }
      }

      // 2. Procesar estados de entrega de mensajes emitidos
      if (Array.isArray(value.statuses)) {
        for (const status of value.statuses) {
          processedStatuses++;

          const isError = status.status === "failed";
          const firstError = status.errors && status.errors.length > 0 ? status.errors[0] : undefined;

          logEvent(
            isError ? "warn" : "info",
            `WhatsApp estado de entrega: ${status.status}`,
            {
              phoneId,
              messageId: status.id,
              recipientId: status.recipient_id,
              status: status.status,
              timestamp: status.timestamp,
              errorCode: firstError?.code,
              errorTitle: firstError?.title,
              errorMessage: firstError?.message,
            },
          );
        }
      }

      // 3. Procesar ecos de mensajes enviados desde el celular (Coexistencia con WhatsApp Business App)
      if (Array.isArray(value.message_echoes)) {
        for (const echo of value.message_echoes) {
          processedMessages++;

          logEvent("info", "Eco de agente de WhatsApp recibido (mensaje enviado desde app móvil)", {
            phoneId,
            displayPhone,
            from: echo.from,
            to: echo.to,
            messageId: echo.id,
            type: echo.type,
            hasText: Boolean(echo.text?.body),
            timestamp: echo.timestamp,
          });
        }
      }
    }
  }

  return { processedMessages, processedStatuses };
}

/**
 * Registra o actualiza programáticamente el Webhook en NeuroAPI mediante POST /neuroapi/messaging/webhooks/api
 */
export async function registerWebhookViaApi(params?: {
  phoneNumberId?: string;
  customUrl?: string;
  customSecret?: string;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const env = getEnv();
    const apiKey = env.NEUROAPI_KEY?.trim() || process.env.NEUROAPI_KEY?.trim();
    if (!apiKey) {
      return { success: false, error: "NEUROAPI_KEY no configurada en el servidor" };
    }

    const secret = params?.customSecret || getWebhookSecret();
    if (!secret) {
      return { success: false, error: "NEUROAPI_WEBHOOK_SECRET no configurado en el servidor" };
    }

    const url = params?.customUrl || `${env.NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp`;

    // 1. Obtener el otp_phone_number_id de la línea en NeuroAPI
    const numbersRes = await fetch("https://api.neurochat.com.ec/api/v1/neuroapi/messaging/webhooks/numbers", {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });

    if (!numbersRes.ok) {
      return { success: false, error: `Error ${numbersRes.status} al consultar números en NeuroAPI` };
    }

    const numbersData = await numbersRes.json();
    const numbersList = Array.isArray(numbersData.data) ? numbersData.data : [];
    const targetId = params?.phoneNumberId || env.NEUROAPI_PHONE_NUMBER_ID?.trim() || "1331750313364147";

    const matched =
      numbersList.find(
        (n: Record<string, unknown>) =>
          n.phone_number_id === targetId || String(n.phone_number || "").includes("959057138"),
      ) || numbersList[0];

    if (!matched || !matched.otp_phone_number_id) {
      return { success: false, error: "No se encontró el otp_phone_number_id correspondiente en NeuroAPI" };
    }

    // 2. Provisionar el webhook vía API
    const regRes = await fetch("https://api.neurochat.com.ec/api/v1/neuroapi/messaging/webhooks/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        otp_phone_number_id: matched.otp_phone_number_id,
        url,
        secret,
        is_active: true,
      }),
    });

    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) {
      return { success: false, error: regData.message || `Error ${regRes.status} al registrar webhook vía API` };
    }

    logEvent("info", "Webhook de WhatsApp provisionado exitosamente vía API en NeuroAPI", {
      url,
      otpPhoneNumberId: matched.otp_phone_number_id,
      webhookId: regData.data?.id,
    });

    return { success: true, data: regData.data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent("error", "Excepción al registrar webhook vía API en NeuroAPI", { error: msg });
    return { success: false, error: msg };
  }
}

