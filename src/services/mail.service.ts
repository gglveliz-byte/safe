/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Servicios de Avisos — Motor de Despacho SMTP Gmail Bilingüe (§5.3)
 * ARCHIVO: src/services/mail.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Despacha el aviso médico de emergencia a los contactos registrados del
 * motociclista mediante el transporte real SMTP de Gmail (`smtp.gmail.com:465`
 * con SSL directo), según el contrato CONGELADO §8 de
 * `docs/BACKEND_CONTRACTS.md`. Normaliza y deduplica los correos destinatarios,
 * compone el contenido bilingüe con `@/services/mail/templates` y envía con
 * concurrencia máxima de 5 usando un encharcado (pool) propio: una cola de
 * trabajadores asíncronos, sin librerías nuevas. El transporte es perezoso a
 * nivel de módulo (se crea una sola vez por proceso) y las credenciales se
 * leen con `getEnv()` DENTRO de las funciones, nunca al cargar el módulo, para
 * que `next build` corra sin secretos. Los fallos parciales nunca lanzan al
 * llamador: siempre se retorna el desglose de entregas y solo se lanza si
 * falta la configuración de correo.
 * ENTRADAS: contactos de emergencia, EmergencyEmailPayload y locale "es"|"en".
 * SALIDAS: EmergencyMailResult (enviados, fallidos, entregas individuales).
 * DEPENDENCIAS: nodemailer ^10, @/lib/env, @/lib/logger, @/services/mail/templates.
 * LEYES DE INGENIERÍA: < 500 líneas · cero mocks (SMTP real) · PII protegida
 * (los logs jamás registran correos completos ni la app password) · comentarios
 * explicativos en Español en cada función.
 * ==============================================================================
 */

import nodemailer, { type Transporter } from "nodemailer";

import { getEnv } from "@/lib/env";
import { logEvent } from "@/lib/logger";
import { buildEmergencyEmailContent, type EmergencyEmailPayload } from "@/services/mail/templates";
import { buildPasswordResetEmailContent } from "@/services/mail/password-reset-template";

/** Contacto de emergencia tal como lo entrega el perfil médico de PostgreSQL. */
export interface EmergencyMailRecipient {
  /** Nombre visible del contacto para el saludo personalizado. */
  name: string;
  /** Dirección de correo donde se despacha el aviso. */
  email: string;
  /** Parentesco declarado (p. ej. "Esposa"); informativo, no bloqueante. */
  relation?: string;
}

/** Desglose de la corrida de despacho contra la lista de contactos. */
export interface EmergencyMailResult {
  /** Avisos efectivamente aceptados por el servidor SMTP de Gmail. */
  sentCount: number;
  /** Avisos fallidos (rebote, red, autenticación): nunca abortan el resto. */
  failedCount: number;
  /** Entrega individual por destinatario válido, en orden de normalización. */
  deliveries: Array<{ email: string; delivered: boolean; messageId?: string; error?: string }>;
}

/* Parámetros congelados §8 del transporte SMTP de Gmail y del despacho. */
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;
const SMTP_TIMEOUT_MS = 20000;
const MAX_CONCURRENT_SENDS = 5;

/** Regex razonable de forma de correo; la validación fuerte es tarea de Zod. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Único mensaje de error que este servicio lanza al llamador (§8). */
const MAIL_NOT_CONFIGURED_MESSAGE = "El servicio de avisos no está configurado.";

/** Longitud máxima del resumen de error que viaja en `deliveries.error`. */
const MAX_ERROR_LENGTH = 180;

/** Credenciales resueltas del entorno para el transporte y el remitente. */
interface MailSettings { user: string; appPassword: string; fromName: string; }

/** Destinatario ya normalizado (trim + minúsculas) y único. */
interface VerifiedRecipient { email: string; name: string; }

/** Elemento de la cola de despacho con su rancho de resultado reservado. */
interface QueueItem { recipient: VerifiedRecipient; slot: number; }

/** Tarea compartida por todos los trabajadores del pool propio. */
interface SendTask {
  transporter: Transporter;
  from: string;
  payload: EmergencyEmailPayload;
  locale: "es" | "en";
  deliveries: EmergencyMailResult["deliveries"];
  /** Secretos que deben quedar fuera de cualquier error registrado o retornado. */
  secrets: string[];
}

/** Transporte perezoso: se construye una sola vez por proceso (§8). */
let cachedTransporter: Transporter | null = null;

/**
 * Lee y valida las credenciales de Gmail DENTRO de la llamada (nunca a nivel
 * de módulo) y convierte cualquier fallo del validador de entorno en el único
 * error público permitido por el contrato.
 */
function resolveMailSettings(): MailSettings {
  try {
    const env = getEnv();
    const settings: MailSettings = {
      user: env.GMAIL_USER.trim(),
      appPassword: env.GMAIL_APP_PASSWORD.trim(),
      fromName: env.GMAIL_FROM_NAME.trim(),
    };
    if (!settings.user || !settings.appPassword || !settings.fromName) {
      throw new Error(MAIL_NOT_CONFIGURED_MESSAGE);
    }
    return settings;
  } catch {
    throw new Error(MAIL_NOT_CONFIGURED_MESSAGE);
  }
}

/**
 * Crea (o reutiliza) el transporte SMTP de Gmail con SSL directo en el 465 y
 * timeouts de conexión y zócalo de 20 segundos exigidos por el contrato.
 */
function obtainTransporter(settings: MailSettings): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: settings.user, pass: settings.appPassword },
      connectionTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
      pool: true,
      maxConnections: MAX_CONCURRENT_SENDS,
    });
  }
  return cachedTransporter;
}

/**
 * Cabecera `from` con el formato `"${GMAIL_FROM_NAME} <GMAIL_USER>"`. El nombre
 * proviene del entorno y se purga de comillas, ángulos y saltos de línea para
 * impedir cualquier inyección en las cabeceras del mensaje.
 */
function buildFromAddress(settings: MailSettings): string {
  const cleanName =
    settings.fromName.replace(/["<>\r\n]/g, " ").replace(/\s+/g, " ").trim() || "SAFE";
  return `"${cleanName}" <${settings.user}>`;
}

/**
 * Normaliza (trim + minúsculas) y deduplica los destinatarios, descartando
 * vacíos y con forma claramente inválida. Conserva el nombre de la primera
 * aparición de cada correo; el resultado ordenado define los ranchos de salida.
 */
function normalizeRecipients(recipients: EmergencyMailRecipient[]): VerifiedRecipient[] {
  const seen = new Set<string>();
  const verified: VerifiedRecipient[] = [];
  for (const recipient of recipients ?? []) {
    const email = (recipient?.email ?? "").trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email) || seen.has(email)) {
      continue;
    }
    seen.add(email);
    verified.push({ email, name: (recipient?.name ?? "").trim() });
  }
  return verified;
}

/**
 * Resume un fallo de envío en un mensaje corto y apto para el parte: colapsa
 * espacios, recorta a 180 caracteres y purga cualquier coincidencia con las
 * credenciales activas para no filtrar la app password ni la cuenta emisora.
 */
function describeSendFailure(error: unknown, secrets: string[]): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  let sanitized = raw.replace(/\s+/g, " ").trim();
  for (const secret of secrets) {
    if (secret) {
      sanitized = sanitized.split(secret).join("[oculto]");
    }
  }
  if (!sanitized) {
    return "Fallo desconocido del servidor de avisos";
  }
  return sanitized.length > MAX_ERROR_LENGTH
    ? `${sanitized.slice(0, MAX_ERROR_LENGTH - 1)}…`
    : sanitized;
}

/**
 * Trabajador del pool propio: consume la cola compartida hasta agotarla,
 * componiendo el contenido bilingüe personalizado por contacto y registrando
 * éxito o fracaso en su rancho reservado. Un fallo nunca aborta el resto de
 * los envíos (§8: continúa aunque un destinatario falle). Los logs omiten el
 * correo completo: solo folio y resultado.
 */
async function mailWorker(queue: QueueItem[], task: SendTask): Promise<void> {
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      break;
    }
    try {
      const content = buildEmergencyEmailContent(task.payload, task.locale, item.recipient.name || undefined);
      const info = await task.transporter.sendMail({ from: task.from, to: item.recipient.email, subject: content.subject, html: content.html, text: content.text });
      task.deliveries[item.slot] = {
        email: item.recipient.email,
        delivered: true,
        ...(info.messageId ? { messageId: info.messageId } : {}),
      };
      logEvent("info", "Aviso médico entregado por correo", {
        folioAlerta: task.payload.alertId,
      });
    } catch (error) {
      const reason = describeSendFailure(error, task.secrets);
      task.deliveries[item.slot] = {
        email: item.recipient.email,
        delivered: false,
        error: reason,
      };
      logEvent("error", "El aviso médico falló al entregarse por correo", {
        folioAlerta: task.payload.alertId,
        motivo: reason,
      });
    }
  }
}

/**
 * Punto de entrada congelado por §8: envía el aviso a todos los contactos
 * válidos con concurrencia máxima 5, deduplicación por correo normalizado y
 * timeouts de 20 s. No lanza por fallos parciales: siempre retorna el desglose;
 * solo lanza si falta la configuración de correo.
 *
 * @param recipients Contactos de emergencia del perfil médico (dinámicos).
 * @param payload Ficha de la alerta producida por el servicio GPS y de emergencia.
 * @param locale Idioma del asunto y del saludo prioritario ("es" | "en").
 * @returns Conteo de enviados, fallidos y entregas individuales.
 */
export async function sendEmergencyAlertEmail(
  recipients: EmergencyMailRecipient[],
  payload: EmergencyEmailPayload,
  locale: "es" | "en",
): Promise<EmergencyMailResult> {
  const queue: QueueItem[] = normalizeRecipients(recipients).map((recipient, slot) => ({ recipient, slot }));

  if (queue.length === 0) {
    logEvent("warn", "Aviso de emergencia sin destinatarios válidos", {
      folioAlerta: payload.alertId,
    });
    return { sentCount: 0, failedCount: 0, deliveries: [] };
  }

  const settings = resolveMailSettings();
  const deliveries: EmergencyMailResult["deliveries"] = new Array(queue.length);
  const task: SendTask = {
    transporter: obtainTransporter(settings),
    from: buildFromAddress(settings),
    payload,
    locale,
    deliveries,
    secrets: [settings.appPassword, settings.user],
  };

  const workerCount = Math.min(MAX_CONCURRENT_SENDS, queue.length);
  logEvent("info", "Despacho de avisos médicos iniciado", {
    folioAlerta: payload.alertId,
    destinatariosValidos: queue.length,
    concurrencia: workerCount,
  });
  await Promise.all(Array.from({ length: workerCount }, () => mailWorker(queue, task)));

  const sentCount = deliveries.filter((entry) => entry.delivered).length;
  const failedCount = queue.length - sentCount;
  logEvent(failedCount === 0 ? "info" : "warn", "Despacho de avisos médicos finalizado", {
    folioAlerta: payload.alertId,
    enviados: sentCount,
    fallidos: failedCount,
  });

  return { sentCount, failedCount, deliveries };
}

/**
 * Despacha el correo de restablecimiento de contraseña al usuario solicitante.
 *
 * @param email Correo electrónico normalizado del usuario.
 * @param resetUrl URL segura con token criptográfico temporal.
 * @param locale Idioma principal del correo ("es" | "en").
 * @param recipientName Nombre visible del usuario (si está disponible).
 * @returns true si el correo fue aceptado por el transporte SMTP de Gmail.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  locale: "es" | "en" = "es",
  recipientName?: string,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    logEvent("warn", "Intento de envío de recuperación con correo inválido", {
      correoOfuscado: normalizedEmail.slice(0, 3) + "***",
    });
    return false;
  }

  const settings = resolveMailSettings();
  const transporter = obtainTransporter(settings);
  const content = buildPasswordResetEmailContent(resetUrl, locale, recipientName);

  try {
    const info = await transporter.sendMail({
      from: buildFromAddress(settings),
      to: normalizedEmail,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    logEvent("info", "Correo de recuperación de contraseña enviado exitosamente", {
      messageId: info.messageId,
      correoOfuscado: normalizedEmail.slice(0, 3) + "***",
    });
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logEvent("error", "Fallo al enviar correo de recuperación de contraseña", {
      error: errorMsg.slice(0, MAX_ERROR_LENGTH),
    });
    return false;
  }
}

