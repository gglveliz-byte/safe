/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Cliente Frontend — Conexión y Gestión de WhatsApp Cloud (NeuroAPI)
 * ARCHIVO: src/lib/whatsapp-client.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Cliente tipado para interactuar con los endpoints de administración de
 * WhatsApp Cloud API oficial a través de NeuroAPI en Next.js.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * ==============================================================================
 */

export interface WhatsAppStatusDTO {
  isConfigured: boolean;
  hasPhoneNumberId: boolean;
  portalUrl: string;
}

export interface WhatsAppTemplateComponentDTO {
  type: string;
  format?: string;
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
}

export interface WhatsAppTemplateDTO {
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED";
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  components: WhatsAppTemplateComponentDTO[];
}

export interface WhatsAppTemplatesResponse {
  stats?: {
    total: number;
    approved: number;
    pending: number;
  };
  templates: WhatsAppTemplateDTO[];
}

export interface SendWhatsAppPayload {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: string[];
  customKey?: string;
}

async function handleHttpError(res: Response): Promise<never> {
  let message = `Error HTTP ${res.status}: ${res.statusText}`;
  try {
    const json = await res.json();
    if (json.message) message = json.message;
    else if (json.error?.message) message = json.error.message;
  } catch {
    // Si no es JSON se conserva el mensaje genérico
  }
  throw new Error(message);
}

export const whatsAppClient = {
  /** Consulta el estado de configuración de NeuroAPI en el backend */
  async getStatus(): Promise<WhatsAppStatusDTO> {
    const res = await fetch("/api/admin/whatsapp/status", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await handleHttpError(res);
    const json = await res.json();
    return json.data;
  },

  /** Obtiene las plantillas oficiales de Meta desde NeuroAPI */
  async getTemplates(customKey?: string): Promise<WhatsAppTemplatesResponse> {
    const query = customKey ? `?customKey=${encodeURIComponent(customKey.trim())}` : "";
    const res = await fetch(`/api/admin/whatsapp/templates${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) await handleHttpError(res);
    const json = await res.json();
    return json.data;
  },

  /** Envía un mensaje de notificación usando una plantilla oficial */
  async sendNotification(
    payload: SendWhatsAppPayload,
  ): Promise<{ success: boolean; messageId?: string; status?: string }> {
    const res = await fetch("/api/admin/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleHttpError(res);
    const json = await res.json();
    return json.data;
  },

  /** Genera una sesión de Meta Embedded Signup v4 para conectar el número (Coexistencia) */
  async getConnectSession(returnUrl?: string): Promise<{ url: string }> {
    const res = await fetch("/api/admin/whatsapp/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl }),
    });
    if (!res.ok) await handleHttpError(res);
    const json = await res.json();
    return json.data;
  },
};


