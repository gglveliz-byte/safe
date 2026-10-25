/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Servicios de Avisos — Plantilla de Restablecimiento de Contraseña
 * ARCHIVO: src/services/mail/password-reset-template.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Genera el documento HTML y de texto plano para los correos de recuperación
 * de acceso de pilotos y administradores. Respeta la estética 'Incident'
 * (lienzo concreto #efefef, tarjeta papel #ffffff, borde 1px negro, baliza
 * Signal Orange y tipografía editorial Times New Roman + Arial).
 *
 * ENTRADAS: resetUrl (enlace con token temporal), locale ("es" | "en") y nombre.
 * SALIDAS: EmailContent { subject, html, text } listo para Nodemailer.
 * DEPENDENCIAS: escapeHtml de @/services/mail/templates.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (archivo autocontenido ~130 líneas).
 * - Cero datos hardcodeados: todo enlace e identidad es dinámico.
 * - Bilingüismo completo: el correo saluda en el idioma del usuario y añade
 *   resumen en el idioma alterno para máxima claridad.
 * ==============================================================================
 */

import { escapeHtml, type EmailContent } from "@/services/mail/templates";

/* Paleta oficial Incident */
const COLOR_CONCRETE = "#efefef";
const COLOR_PAPER = "#ffffff";
const COLOR_INK = "#000000";
const COLOR_SIGNAL = "#f25533";
const COLOR_CARBON = "#4a4a4a";
const COLOR_HAIRLINE = "#dadada";

/* Tipografía bimodal oficial */
const FONT_TIMES = "'Times New Roman', Times, Georgia, serif";
const FONT_ARIAL = "Arial, Helvetica, sans-serif";

/** Diccionario editorial bilingüe para el correo de recuperación */
const COPY = {
  es: {
    subject: "[SAFE] Restablece tu contraseña de acceso",
    badge: "RECUPERACIÓN DE CUENTA",
    greeting: (name?: string) => (name ? `Hola, ${name}:` : "Estimado piloto:"),
    headline: "Solicitud para restablecer tu contraseña",
    lead: "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en la red de auxilio SAFE. Si fuiste tú, presiona el botón inferior para ingresar una nueva clave.",
    button: "Restablecer mi Contraseña",
    expirationNotice: "Por razones de seguridad médica y protección de cuenta, este enlace expirará en 15 minutos.",
    securityWarning: "Si tú no solicitaste este cambio, puedes ignorar este mensaje con total tranquilidad. Tu contraseña actual permanece segura y nadie ha accedido a tu ficha médica.",
    footerNote: "SAFE · Respaldo Médico y Telemetría en Carretera para Motociclistas. Mensaje automático, no responder.",
  },
  en: {
    subject: "[SAFE] Reset your access password",
    badge: "ACCOUNT RECOVERY",
    greeting: (name?: string) => (name ? `Hello, ${name}:` : "Dear rider:"),
    headline: "Password Reset Request",
    lead: "We received a request to reset your password on the SAFE emergency ledger. If this was you, please click the button below to set a new password.",
    button: "Reset My Password",
    expirationNotice: "For medical security and account safety, this link will expire in 15 minutes.",
    securityWarning: "If you did not request this change, you can safely ignore this email. Your current password remains secure and your medical ledger has not been accessed.",
    footerNote: "SAFE · Emergency Medical & Real-Time GPS Ledger for Riders. Automated notification, do not reply.",
  },
};

/**
 * Compone el documento de correo bilingüe para el restablecimiento de contraseña.
 *
 * @param resetUrl Enlace seguro con el token de recuperación temporal.
 * @param locale Idioma principal seleccionado ("es" | "en").
 * @param recipientName Nombre opcional del usuario para el saludo personalizado.
 * @returns EmailContent completo (asunto, HTML y texto plano).
 */
export function buildPasswordResetEmailContent(
  resetUrl: string,
  locale: "es" | "en" = "es",
  recipientName?: string,
): EmailContent {
  const primary = COPY[locale];
  const secondary = locale === "es" ? COPY.en : COPY.es;
  const safeName = recipientName ? escapeHtml(recipientName) : undefined;
  const safeUrl = escapeHtml(resetUrl);

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(primary.subject)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: ${COLOR_CONCRETE}; font-family: ${FONT_ARIAL}; color: ${COLOR_INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: ${COLOR_PAPER}; border: 1px solid ${COLOR_INK}; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Cabecera de Marca -->
    <tr>
      <td style="padding: 20px 24px; border-bottom: 1px solid ${COLOR_INK};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${COLOR_SIGNAL}; margin-right: 8px;"></span>
              <span style="font-family: ${FONT_ARIAL}; font-size: 11px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: ${COLOR_CARBON};">
                ${escapeHtml(primary.badge)}
              </span>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="font-family: ${FONT_TIMES}; font-size: 20px; font-weight: bold; letter-spacing: -0.02em; color: ${COLOR_INK};">SAFE</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Contenido Principal -->
    <tr>
      <td style="padding: 28px 24px;">
        <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: ${COLOR_CARBON};">
          ${escapeHtml(primary.greeting(safeName))}
        </p>
        <h1 style="margin: 0 0 16px 0; font-family: ${FONT_TIMES}; font-size: 24px; font-weight: bold; line-height: 1.25; color: ${COLOR_INK};">
          ${escapeHtml(primary.headline)}
        </h1>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: ${COLOR_INK};">
          ${escapeHtml(primary.lead)}
        </p>

        <!-- Botón de Acción Broadsheet -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td align="center" style="background-color: ${COLOR_PAPER}; border: 2px solid ${COLOR_INK}; border-radius: 4px;">
              <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-family: ${FONT_ARIAL}; font-size: 14px; font-weight: bold; color: ${COLOR_INK}; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em;">
                ${escapeHtml(primary.button)} →
              </a>
            </td>
          </tr>
        </table>

        <!-- Aviso de Expiración -->
        <div style="margin: 20px 0; padding: 12px 14px; background-color: ${COLOR_CONCRETE}; border-left: 3px solid ${COLOR_SIGNAL}; font-size: 12px; line-height: 1.4; color: ${COLOR_CARBON};">
          ⏱ <strong>${escapeHtml(primary.expirationNotice)}</strong>
        </div>

        <!-- Advertencia de Seguridad -->
        <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 1.5; color: ${COLOR_CARBON};">
          ${escapeHtml(primary.securityWarning)}
        </p>
      </td>
    </tr>

    <!-- Separador Capilar -->
    <tr>
      <td style="padding: 0 24px;"><div style="height: 1px; background-color: ${COLOR_HAIRLINE};"></div></td>
    </tr>

    <!-- Resumen en Idioma Secundario -->
    <tr>
      <td style="padding: 20px 24px; font-size: 12px; line-height: 1.45; color: ${COLOR_CARBON};">
        <strong>${escapeHtml(secondary.headline)}:</strong> ${escapeHtml(secondary.lead)}
        <div style="margin-top: 8px;">
          <a href="${safeUrl}" style="color: ${COLOR_INK}; font-weight: bold; text-decoration: underline;">
            ${escapeHtml(secondary.button)}
          </a>
        </div>
      </td>
    </tr>

    <!-- Pie de Página Legal -->
    <tr>
      <td style="padding: 16px 24px; border-top: 1px solid ${COLOR_INK}; background-color: ${COLOR_CONCRETE}; font-size: 11px; color: ${COLOR_CARBON}; text-align: center;">
        ${escapeHtml(primary.footerNote)}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `SAFE - RECUPERACION DE CUENTA / ACCOUNT RECOVERY
==================================================

${primary.greeting(recipientName)}

${primary.headline}
${primary.lead}

ENLACE DE RESTABLECIMIENTO / RESET LINK:
${resetUrl}

(${primary.expirationNotice})

${primary.securityWarning}

--------------------------------------------------
${secondary.headline}
${secondary.lead}
${secondary.expirationNotice}

Link: ${resetUrl}
--------------------------------------------------
${primary.footerNote}`;

  return {
    subject: primary.subject,
    html,
    text,
  };
}
