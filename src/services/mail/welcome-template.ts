/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Servicios de Avisos — Plantilla de Correo de Bienvenida Institucional
 * ARCHIVO: src/services/mail/welcome-template.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Genera el documento HTML y de texto plano para los correos de bienvenida
 * de nuevos motociclistas registrados en la plataforma. Respeta la estética
 * oficial 'Incident — Technical Broadsheet 2026' (paleta Navy Dark #0B1F3A,
 * Acento #FF5138, lienzo #F8FAFC, tarjeta #FFFFFF, bordes #D7E3F0 y tipografía
 * bimodal Georgia/Inter).
 *
 * ENTRADAS: WelcomeEmailPayload (nombre, correo, folio opcional, url de login, idioma).
 * SALIDAS: EmailContent { subject, html, text } listo para Nodemailer.
 * DEPENDENCIAS: escapeHtml de @/services/mail/templates.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 260 líneas).
 * - Cero textos hardcodeados o mocks de demostración.
 * - Soporte bilingüe ES / EN.
 * ==============================================================================
 */

import { escapeHtml, type EmailContent } from "@/services/mail/templates";

/* Paleta oficial Incident — Technical Broadsheet 2026 */
const COLOR_BG = "#F8FAFC";
const COLOR_CARD = "#FFFFFF";
const COLOR_NAVY = "#0B1F3A";
const COLOR_NAVY_LIGHT = "#15365B";
const COLOR_ACCENT = "#FF5138";
const COLOR_BORDER = "#D7E3F0";
const COLOR_BORDER_FIELD = "#C9D9E9";
const COLOR_TEXT_DESC = "#23466D";
const COLOR_TEXT_MUTED = "#5C718A";
const COLOR_STEP_BG = "#EDF5FC";

/* Tipografía bimodal oficial */
const FONT_SERIF = "Georgia, 'Times New Roman', Times, serif";
const FONT_SANS = "'Inter', Arial, Helvetica, sans-serif";

export interface WelcomeEmailPayload {
  fullName: string;
  email: string;
  deviceCode?: string;
  loginUrl: string;
  locale?: "es" | "en";
}

const COPY = {
  es: {
    subject: "🛡️ ¡Bienvenido a SAFE! Tu respaldo médico en carretera comienza aquí",
    badge: "PROTOCOLO DE RESCATE VIAL 2026",
    title: (name: string) => `¡Bienvenido a SAFE, ${name}!`,
    subtitle: "Tu cuenta de piloto ha sido registrada con éxito en la red de asistencia médica para motociclistas.",
    lead: "En carretera, cada segundo cuenta. Ahora que eres parte de SAFE, tienes acceso a un protocolo de protección que habla por ti ante cualquier emergencia, comunicando tus datos vitales y ubicación satelital a paramédicos y familiares.",
    stepsTitle: "PASOS PARA ACTIVAR TU PROTECCIÓN 24/7:",
    step1Title: "1. Inicia sesión en tu panel",
    step1Desc: "Accede con tu correo registrado y la contraseña que creaste.",
    step2Title: "2. Vincula el PIN secreto de tu casco",
    step2Desc: (code?: string) =>
      code
        ? `Ingresa a tu panel para reclamar y activar tu kit ${code} con su PIN de 6 dígitos.`
        : "Ingresa el folio de tu kit y el PIN secreto de 6 dígitos que vino con tu dispositivo físico.",
    step3Title: "3. Completa tu ficha médica y cédula",
    step3Desc: "Declara tu grupo sanguíneo, alergias, contactos de auxilio y sube la foto de tu cédula (anverso y reverso) para verificación en rescates.",
    step4Title: "4. Pega el chip en tu casco",
    step4Desc: "Coloca el sticker NFC en un lateral accesible de tu casco. Si sufres un percance, cualquier teléfono que lo toque abrirá tu ficha y alertará a tu familia.",
    ctaButton: "Iniciar Sesión en mi Panel",
    needHelp: "¿Tienes dudas o necesitas asistencia con tu kit?",
    supportTeam: "Nuestro equipo técnico está listo para ayudarte en",
    footerText: "SAFE — Emergency Medical & Real-Time GPS Ledger for Riders. Edición 2026.",
    footerAuto: "Mensaje institucional automático de confirmación de registro. No responder directamente a esta dirección.",
  },
  en: {
    subject: "🛡️ Welcome to SAFE! Your roadside medical backup starts here",
    badge: "ROADSIDE RESCUE PROTOCOL 2026",
    title: (name: string) => `Welcome to SAFE, ${name}!`,
    subtitle: "Your rider account has been successfully registered on the emergency medical network.",
    lead: "On the road, every second counts. As part of SAFE, you now have access to a protective ledger that speaks for you in any incident, delivering your vital medical data and GPS coordinates to paramedics and loved ones.",
    stepsTitle: "STEPS TO ACTIVATE YOUR 24/7 PROTECTION:",
    step1Title: "1. Sign in to your dashboard",
    step1Desc: "Log in using your registered email and the password you created.",
    step2Title: "2. Claim your helmet kit with your secret PIN",
    step2Desc: (code?: string) =>
      code
        ? `Enter your dashboard to link and activate your kit ${code} with its 6-digit PIN.`
        : "Enter your kit folio and the 6-digit secret PIN included with your physical device.",
    step3Title: "3. Complete your medical record and ID card",
    step3Desc: "Declare your blood type, allergies, emergency contacts, and upload your ID credential photos (front and back).",
    step4Title: "4. Stick the tag on your helmet",
    step4Desc: "Place the NFC tag on an accessible spot on your helmet. In an incident, a single tap opens your record and notifies your family with GPS.",
    ctaButton: "Sign In to My Dashboard",
    needHelp: "Have questions or need assistance with your kit?",
    supportTeam: "Our technical support team is ready to help at",
    footerText: "SAFE — Emergency Medical & Real-Time GPS Ledger for Riders. Edition 2026.",
    footerAuto: "Automated account confirmation notification. Do not reply directly to this email.",
  },
};

export function buildWelcomeEmailContent(payload: WelcomeEmailPayload): EmailContent {
  const locale = payload.locale === "en" ? "en" : "es";
  const c = COPY[locale];
  const safeName = escapeHtml(payload.fullName || "Piloto");
  const safeEmail = escapeHtml(payload.email);
  const safeLoginUrl = escapeHtml(payload.loginUrl);
  const safeCode = payload.deviceCode ? escapeHtml(payload.deviceCode) : undefined;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: ${COLOR_BG}; font-family: ${FONT_SANS}; color: ${COLOR_NAVY};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: ${COLOR_CARD}; border: 1px solid ${COLOR_BORDER}; border-radius: 12px; box-shadow: 0 4px 16px rgba(11,31,58,0.06); overflow: hidden;">
    
    <!-- Barra Superior de Marca Oficial SAFE -->
    <tr>
      <td style="background-color: ${COLOR_NAVY}; padding: 22px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${COLOR_ACCENT}; margin-right: 8px; vertical-align: middle;"></span>
              <span style="font-family: ${FONT_SANS}; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #FFFFFF; vertical-align: middle;">
                ${escapeHtml(c.badge)}
              </span>
            </td>
            <td align="right" style="vertical-align: middle;">
              <span style="font-family: ${FONT_SERIF}; font-size: 20px; font-weight: bold; color: #FFFFFF; letter-spacing: -0.02em;">
                SAFE
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Contenido Principal -->
    <tr>
      <td style="padding: 32px 28px 24px 28px;">
        <h1 style="margin: 0 0 12px 0; font-family: ${FONT_SERIF}; font-size: 26px; line-height: 1.25; font-weight: bold; color: ${COLOR_NAVY};">
          ${c.title(safeName)}
        </h1>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: ${COLOR_TEXT_DESC}; font-weight: 500;">
          ${escapeHtml(c.subtitle)}
        </p>
        <p style="margin: 0 0 28px 0; font-size: 13px; line-height: 1.6; color: ${COLOR_TEXT_MUTED};">
          ${escapeHtml(c.lead)}
        </p>

        <!-- Bloque de Cuenta Creada -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: ${COLOR_STEP_BG}; border: 1px solid ${COLOR_BORDER_FIELD}; border-radius: 8px;">
          <tr>
            <td style="padding: 14px 18px;">
              <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${COLOR_TEXT_DESC};">
                CORREO REGISTRADO
              </span>
              <span style="display: block; font-family: ${FONT_SANS}; font-size: 14px; font-weight: 700; color: ${COLOR_NAVY}; margin-top: 2px;">
                ${safeEmail}
              </span>
            </td>
            ${safeCode ? `
            <td align="right" style="padding: 14px 18px;">
              <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${COLOR_TEXT_DESC};">
                FOLIO ASIGNADO
              </span>
              <span style="display: block; font-family: ${FONT_SANS}; font-size: 14px; font-weight: 700; color: ${COLOR_ACCENT}; margin-top: 2px;">
                ${safeCode}
              </span>
            </td>` : ""}
          </tr>
        </table>

        <!-- Guía de 4 Pasos -->
        <h2 style="margin: 0 0 16px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${COLOR_NAVY};">
          ${escapeHtml(c.stepsTitle)}
        </h2>

        <!-- Paso 1 -->
        <div style="margin-bottom: 14px; padding: 12px 14px; background-color: #FFFFFF; border-left: 3px solid ${COLOR_NAVY}; border-radius: 0 6px 6px 0; border-top: 1px solid ${COLOR_BORDER}; border-right: 1px solid ${COLOR_BORDER}; border-bottom: 1px solid ${COLOR_BORDER};">
          <strong style="display: block; font-size: 13px; color: ${COLOR_NAVY};">${escapeHtml(c.step1Title)}</strong>
          <span style="display: block; font-size: 12px; color: ${COLOR_TEXT_MUTED}; margin-top: 2px;">${escapeHtml(c.step1Desc)}</span>
        </div>

        <!-- Paso 2 -->
        <div style="margin-bottom: 14px; padding: 12px 14px; background-color: #FFFFFF; border-left: 3px solid ${COLOR_ACCENT}; border-radius: 0 6px 6px 0; border-top: 1px solid ${COLOR_BORDER}; border-right: 1px solid ${COLOR_BORDER}; border-bottom: 1px solid ${COLOR_BORDER};">
          <strong style="display: block; font-size: 13px; color: ${COLOR_NAVY};">${escapeHtml(c.step2Title)}</strong>
          <span style="display: block; font-size: 12px; color: ${COLOR_TEXT_MUTED}; margin-top: 2px;">${escapeHtml(c.step2Desc(safeCode))}</span>
        </div>

        <!-- Paso 3 -->
        <div style="margin-bottom: 14px; padding: 12px 14px; background-color: #FFFFFF; border-left: 3px solid ${COLOR_NAVY}; border-radius: 0 6px 6px 0; border-top: 1px solid ${COLOR_BORDER}; border-right: 1px solid ${COLOR_BORDER}; border-bottom: 1px solid ${COLOR_BORDER};">
          <strong style="display: block; font-size: 13px; color: ${COLOR_NAVY};">${escapeHtml(c.step3Title)}</strong>
          <span style="display: block; font-size: 12px; color: ${COLOR_TEXT_MUTED}; margin-top: 2px;">${escapeHtml(c.step3Desc)}</span>
        </div>

        <!-- Paso 4 -->
        <div style="margin-bottom: 28px; padding: 12px 14px; background-color: #FFFFFF; border-left: 3px solid ${COLOR_NAVY_LIGHT}; border-radius: 0 6px 6px 0; border-top: 1px solid ${COLOR_BORDER}; border-right: 1px solid ${COLOR_BORDER}; border-bottom: 1px solid ${COLOR_BORDER};">
          <strong style="display: block; font-size: 13px; color: ${COLOR_NAVY};">${escapeHtml(c.step4Title)}</strong>
          <span style="display: block; font-size: 12px; color: ${COLOR_TEXT_MUTED}; margin-top: 2px;">${escapeHtml(c.step4Desc)}</span>
        </div>

        <!-- Botón de Llamado a la Acción (CTA) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
          <tr>
            <td align="center">
              <a href="${safeLoginUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background-color: ${COLOR_NAVY}; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; box-shadow: 0 2px 8px rgba(11,31,58,0.25);">
                ${escapeHtml(c.ctaButton)} →
              </a>
            </td>
          </tr>
        </table>

        <!-- Asistencia y Soporte -->
        <div style="padding-top: 20px; border-top: 1px solid ${COLOR_BORDER}; font-size: 12px; line-height: 1.5; color: ${COLOR_TEXT_MUTED}; text-align: center;">
          <span>${escapeHtml(c.needHelp)}</span><br>
          <span>${escapeHtml(c.supportTeam)} <a href="mailto:soporte@safe.com" style="color: ${COLOR_ACCENT}; text-decoration: underline; font-weight: 600;">soporte@safe.com</a></span>
        </div>
      </td>
    </tr>

    <!-- Pie Editorial Oficial -->
    <tr>
      <td style="padding: 20px 28px; background-color: ${COLOR_STEP_BG}; border-top: 1px solid ${COLOR_BORDER}; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: ${COLOR_NAVY}; letter-spacing: 0.05em;">
          ${escapeHtml(c.footerText)}
        </p>
        <p style="margin: 0; font-size: 10px; color: ${COLOR_TEXT_MUTED};">
          ${escapeHtml(c.footerAuto)}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${c.badge}
============================================================
${c.title(payload.fullName)}
${c.subtitle}
------------------------------------------------------------
${c.lead}

CUENTA REGISTRADA: ${payload.email}${payload.deviceCode ? `\nFOLIO ASIGNADO: ${payload.deviceCode}` : ""}

${c.stepsTitle}
1. ${c.step1Title}: ${c.step1Desc}
2. ${c.step2Title}: ${c.step2Desc(payload.deviceCode)}
3. ${c.step3Title}: ${c.step3Desc}
4. ${c.step4Title}: ${c.step4Desc}

ACCEDER A TU PANEL:
${payload.loginUrl}

------------------------------------------------------------
${c.needHelp}
${c.supportTeam} soporte@safe.com

${c.footerText}
${c.footerAuto}
`;

  return {
    subject: c.subject,
    html,
    text,
  };
}
