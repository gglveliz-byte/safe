/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Servicios de Avisos — Motor de Mensajería WhatsApp Cloud (NeuroAPI)
 * ARCHIVO: src/services/whatsapp.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Conecta WhatsApp Business Cloud API vía NeuroAPI. Gestiona líneas conectadas,
 * consulta de plantillas Meta y despacho de notificaciones de emergencia.
 * Regla: Límite estricto < 500 líneas físicas.
 * ==============================================================================
 */

import { getEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";

const NEUROAPI_BASE_URL = "https://api.neurochat.com.ec/api/v1";

/** Estructura de componente de plantilla oficial de Meta */
export interface MetaTemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "DOCUMENT" | "VIDEO";
  text?: string;
  example?: { header_text?: string[]; body_text?: string[][] };
}

/** Modelo de plantilla de WhatsApp retornada por NeuroAPI */
export interface WhatsAppTemplate {
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED";
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  components: MetaTemplateComponent[];
}

/** Estadísticas de plantillas de la cuenta */
export interface WhatsAppTemplateStats {
  total: number;
  approved: number;
  pending: number;
  rejected?: number;
}

/** Resultado de consulta de plantillas */
export interface ListTemplatesResult {
  success: boolean; stats?: WhatsAppTemplateStats; templates: WhatsAppTemplate[];
  error?: string; isMetaPermissionNotice?: boolean; requiresSelection?: boolean;
}

/** Línea telefónica oficial de WhatsApp conectada en NeuroAPI */
export interface ConnectedPhoneNumber {
  phoneNumber: string; phoneNumberId: string; wabaName: string; tokenStatus?: string;
}

/** Resultado de listar líneas telefónicas conectadas */
export interface ListPhoneNumbersResult {
  success: boolean; numbers: ConnectedPhoneNumber[]; error?: string;
}

/** Parámetros para envío de notificación basada en plantilla */
export interface SendTemplateParams {
  to: string; templateName: string; languageCode?: string; bodyParameters?: string[]; fromPhoneNumberId?: string;
}

/** Resultado de despacho de mensaje de WhatsApp */
export interface SendWhatsAppResult {
  success: boolean; messageId?: string; status?: string; error?: string; errorCode?: string | number;
}

/**
 * Normaliza un número telefónico a formato canónico E.164 (solo dígitos, sin '+', sin espacios).
 * Ej: "+593 98 765 4321" -> "593987654321"
 * Si ingresan formato móvil local de Ecuador de 10 dígitos (ej: "0987654321"),
 * se normaliza automáticamente al estándar internacional 593 -> "593987654321".
 */
export function formatE164Phone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("09")) {
    return `593${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Obtiene la API Key de NeuroAPI configurada en el entorno.
 */
export function getNeuroApiKey(): string | null {
  try {
    const env = getEnv();
    const key = env.NEUROAPI_KEY?.trim() || process.env.NEUROAPI_KEY?.trim();
    return key && key.length > 5 ? key : null;
  } catch {
    return process.env.NEUROAPI_KEY?.trim() || null;
  }
}

/**
 * Consulta la lista de números telefónicos oficiales conectados en NeuroAPI.
 * Permite filtrar plantillas y envíos por línea telefónica específica (phone_number_id).
 */
export async function listConnectedPhoneNumbers(customApiKey?: string): Promise<ListPhoneNumbersResult> {
  const apiKey = (customApiKey || getNeuroApiKey())?.trim();

  if (!apiKey) {
    return { success: false, numbers: [], error: "La API Key de NeuroAPI no está configurada." };
  }

  try {
    const response = await fetch(`${NEUROAPI_BASE_URL}/neuroapi/messaging/webhooks/numbers`, {
      method: "GET",
      headers: { "x-api-key": apiKey, Accept: "application/json" },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        numbers: [],
        error: data.message || `Error ${response.status} al consultar números en NeuroAPI`,
      };
    }

    const rawList = Array.isArray(data.data) ? data.data : [];
    const numbers: ConnectedPhoneNumber[] = rawList.map((item: Record<string, unknown>) => ({
      phoneNumber: String(item.phone_number || ""),
      phoneNumberId: String(item.phone_number_id || ""),
      wabaName: String(item.waba_name || "Línea WhatsApp"),
      tokenStatus: typeof item.token_status === "string" ? item.token_status : undefined,
    }));

    return { success: true, numbers };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logEvent("error", "Error de red al listar números de WhatsApp en NeuroAPI", { error: errorMsg });
    return { success: false, numbers: [], error: "No se pudo conectar con el catálogo de líneas de NeuroAPI." };
  }
}

/**
 * Consulta la lista de plantillas oficiales de Meta asociadas a un número específico.
 *
 * @param customApiKey Clave opcional para pruebas desde la interfaz si aún no está en .env
 * @param phoneNumberId ID de teléfono en Meta para aislar plantillas y evitar fugas cross-WABA
 * @returns Lista de plantillas clasificadas por estado y categoría.
 */
export async function listWhatsAppTemplates(
  customApiKey?: string,
  phoneNumberId?: string,
): Promise<ListTemplatesResult> {
  const apiKey = (customApiKey || getNeuroApiKey())?.trim();

  if (!apiKey) {
    return {
      success: false,
      templates: [],
      error: "La API Key de NeuroAPI no está configurada. Agrégala en el panel o en tu archivo .env.",
    };
  }

  let targetId = (phoneNumberId || getEnv().NEUROAPI_PHONE_NUMBER_ID)?.trim();

  // Auto-descubrimiento inteligente: si no se especificó ID, buscar en las líneas conectadas de NeuroAPI
  if (!targetId) {
    const numbersRes = await listConnectedPhoneNumbers(apiKey);
    if (numbersRes.success && numbersRes.numbers.length > 0) {
      // Priorizar la línea oficial ecuatoriana de la empresa (959057138) o la primera línea conectada
      const matched = numbersRes.numbers.find(n => n.phoneNumber.includes("959057138")) || numbersRes.numbers[0];
      if (matched && matched.phoneNumberId) {
        targetId = matched.phoneNumberId;
      }
    }
  }

  // Aislamiento estricto: Si tras la consulta aún no hay línea conectada
  if (!targetId) {
    return {
      success: true,
      stats: { total: 0, approved: 0, pending: 0 },
      templates: [],
      requiresSelection: true,
      error: "Conecta tu número oficial mediante el botón de Coexistencia para cargar automáticamente sus plantillas.",
    };
  }

  try {
    const queryParams = new URLSearchParams({ phone_number_id: targetId, limit: "50" });
    const response = await fetch(`${NEUROAPI_BASE_URL}/neuroapi/messaging/templates?${queryParams.toString()}`, {
      method: "GET",
      headers: { "x-api-key": apiKey, Accept: "application/json" },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Diagnóstico específico: si Meta no tiene plantillas creadas o falta permiso de lectura WABA
      const metaCode = data.details?.error?.code;
      const metaSubcode = data.details?.error?.error_subcode;
      if (metaCode === 100 || metaSubcode === 33) {
        return { success: true, stats: { total: 0, approved: 0, pending: 0 }, templates: [], isMetaPermissionNotice: true, error: "Conexión oficial activa. Tu cuenta aún no tiene plantillas creadas en Meta Business Suite o requiere el permiso de lectura en el WABA. Puedes ingresar el nombre de tu plantilla manualmente." };
      }

      const errorMsg = data.message || `Error ${response.status} al consultar plantillas en NeuroAPI`;
      logEvent("warn", "Aviso al consultar plantillas de WhatsApp en NeuroAPI", {
        status: response.status,
        error: errorMsg,
      });

      return {
        success: false,
        templates: [],
        error: errorMsg,
      };
    }

    const templates: WhatsAppTemplate[] = data.data?.templates || [];
    const stats: WhatsAppTemplateStats = data.data?.stats || {
      total: templates.length,
      approved: templates.filter((t) => t.status === "APPROVED").length,
      pending: templates.filter((t) => t.status === "PENDING").length,
    };

    return {
      success: true,
      stats,
      templates,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logEvent("error", "Error de red al conectar con NeuroAPI", { error: errorMsg });
    return {
      success: false,
      templates: [],
      error: "No se pudo establecer conexión con los servidores de NeuroAPI.",
    };
  }
}

/**
 * Despacha un mensaje de notificación usando una Plantilla Oficial de Meta.
 * Garantiza entrega inmediata y confiable sin restricciones de la ventana de 24 horas.
 *
 * @param params Parámetros de envío (destinatario, nombre de plantilla, variables).
 * @param customApiKey Clave opcional para pruebas inmediatas.
 */
export async function sendWhatsAppNotification(
  params: SendTemplateParams,
  customApiKey?: string,
): Promise<SendWhatsAppResult> {
  const apiKey = (customApiKey || getNeuroApiKey())?.trim();

  if (!apiKey) {
    return {
      success: false,
      error: "No hay una API Key de NeuroAPI configurada en el sistema.",
    };
  }

  const cleanTo = formatE164Phone(params.to);
  if (cleanTo.length < 8 || cleanTo.length > 15) {
    return {
      success: false,
      error: `El número de teléfono '${params.to}' no es válido para WhatsApp en formato internacional E.164.`,
    };
  }

  // Estructurar componentes con parámetros del cuerpo
  const components: Array<{ type: string; parameters: Array<{ type: string; text: string }> }> = [];

  if (params.bodyParameters && params.bodyParameters.length > 0) {
    components.push({
      type: "body",
      parameters: params.bodyParameters.map((val) => ({
        type: "text",
        text: String(val || "").trim(),
      })),
    });
  }

  const templateObj: Record<string, unknown> = {
    name: params.templateName.trim(),
    language: {
      code: params.languageCode || "es",
    },
  };

  // Solo incluir components si existen parámetros para evitar rechazo en plantillas sin variables
  if (components.length > 0) {
    templateObj.components = components;
  }

  const payload: Record<string, unknown> = {
    to: cleanTo,
    type: "template",
    template: templateObj,
  };

  const fromId = params.fromPhoneNumberId || getEnv().NEUROAPI_PHONE_NUMBER_ID?.trim();
  if (fromId) {
    payload.from_phone_number_id = fromId;
  }

  try {
    const response = await fetch(`${NEUROAPI_BASE_URL}/neuroapi/messaging/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data.message || `Error ${response.status} de NeuroAPI`;
      logEvent("warn", "Fallo al enviar notificación de WhatsApp", {
        status: response.status,
        error: errorMsg,
        telefonoOfuscado: cleanTo.slice(0, 4) + "***",
      });

      return {
        success: false,
        error: errorMsg,
        errorCode: data.error_code || response.status,
      };
    }

    logEvent("info", "Notificación WhatsApp despachada exitosamente vía NeuroAPI", {
      messageId: data.data?.message_id,
      plantilla: params.templateName,
      telefonoOfuscado: cleanTo.slice(0, 4) + "***",
    });

    return {
      success: true,
      messageId: data.data?.message_id,
      status: data.data?.status || "sent",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logEvent("error", "Excepción al contactar NeuroAPI para envío de WhatsApp", { error: errorMsg });
    return {
      success: false,
      error: "Error inesperado de comunicación con el motor de WhatsApp NeuroAPI.",
    };
  }
}

/**
 * Genera una sesión oficial de conexión de WhatsApp con Meta Embedded Signup.
 * Permite al administrador vincular su número telefónico en modo Coexistencia
 * (para seguir usando WhatsApp Business en el móvil y a la vez la Cloud API).
 *
 * @param returnUrl URL de retorno tras completar el flujo oficial en Meta.
 */
export async function createWhatsAppConnectSession(
  returnUrl: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const apiKey = getNeuroApiKey();
  if (!apiKey) {
    return { success: false, error: "No hay una API Key de NeuroAPI configurada en el sistema." };
  }

  try {
    const response = await fetch(`${NEUROAPI_BASE_URL}/neuroapi/connect/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        service_type: "whatsapp_cloud_api",
        return_url: returnUrl,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || data.message || "Error al iniciar sesión de conexión con Meta.",
      };
    }

    return {
      success: true,
      url: data.data?.url,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/** Parámetros para despacho automático de auxilio a los contactos de emergencia */
export interface EmergencyAlertWhatsAppPayload {
  contacts: Array<{ name: string; phone: string; relation?: string }>;
  riderName: string;
  bloodType: string;
  googleMapsUrl?: string;
  dmsFormatted?: string;
  alertId: string;
  locale?: "es" | "en";
  companion?: {
    fullName: string;
    bloodType?: string;
  } | null;
}

/** Despacha notificaciones de auxilio vía WhatsApp oficial a contactos de emergencia en su idioma preferido */
export async function sendEmergencyWhatsAppAlerts(
  payload: EmergencyAlertWhatsAppPayload,
  templateName?: string,
): Promise<{ sentCount: number; errors: string[] }> {
  const apiKey = getNeuroApiKey();
  if (!apiKey || payload.contacts.length === 0) return { sentCount: 0, errors: [] };

  const isEn = payload.locale === "en";
  const defaultTpl = isEn
    ? (process.env.NEUROAPI_EMERGENCY_TEMPLATE_EN || "alerta_emergencia_altuschip_en")
    : (process.env.NEUROAPI_EMERGENCY_TEMPLATE || "alerta_emergencia_altuschip");
  const tplName = (templateName || defaultTpl).trim();
  const langCode = isEn ? "en" : "es";

  let sentCount = 0;
  const errors: string[] = [];

  // Formato elegante de conductor (+ acompañante habitual si viajan juntos)
  const riderLabel = payload.companion?.fullName
    ? (isEn
        ? `${payload.riderName} and passenger ${payload.companion.fullName}`
        : `${payload.riderName} y su acompañante ${payload.companion.fullName}`)
    : payload.riderName;

  for (const contact of payload.contacts) {
    try {
      const cleanPhone = formatE164Phone(contact.phone);
      if (cleanPhone.length < 8) continue;

      // Variable {{1}}: Saludo personalizado familiar + piloto y acompañante
      const unifiedRecipient = isEn
        ? (contact.relation
            ? `${contact.name} (${contact.relation} of ${riderLabel})`
            : `${contact.name} (family contact of ${riderLabel})`)
        : (contact.relation
            ? `${contact.name} (${contact.relation} de ${riderLabel})`
            : `${contact.name} (familiar de ${riderLabel})`);

      // Variable {{2}}: Grupo sanguíneo de conductor (+ acompañante si viajan juntos)
      let bloodVal = payload.bloodType || (isEn ? "Unknown" : "Desconocido");
      if (payload.companion?.fullName && payload.companion.bloodType) {
        bloodVal = isEn
          ? `Rider: ${bloodVal} | Passenger: ${payload.companion.bloodType}`
          : `Piloto: ${bloodVal} | Acompañante: ${payload.companion.bloodType}`;
      }

      // Variable {{3}}: Enlace satelital de Google Maps
      const mapsVal = payload.googleMapsUrl || (isEn ? "Satellite location in progress" : "Ubicación satelital en proceso");
      const bodyParameters = [unifiedRecipient, bloodVal, mapsVal];

      const res = await sendWhatsAppNotification({
        to: cleanPhone,
        templateName: tplName,
        languageCode: langCode,
        bodyParameters,
      });

      if (res.success) {
        sentCount++;
      } else if (res.error) {
        errors.push(`${cleanPhone}: ${res.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${contact.phone}: ${msg}`);
    }
  }

  logEvent("info", "Despacho de alertas de auxilio WhatsApp completado", {
    alertId: payload.alertId,
    idioma: langCode,
    totalContactos: payload.contacts.length,
    enviadosExitosos: sentCount,
    conAcompanante: Boolean(payload.companion?.fullName),
    errores: errors.length > 0 ? errors : undefined,
  });

  return { sentCount, errors };
}


