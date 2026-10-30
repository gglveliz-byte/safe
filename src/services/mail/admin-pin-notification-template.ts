/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Mensajería & Correo — Plantilla Oficial de Notificación de PIN para Admin
 * ARCHIVO: src/services/mail/admin-pin-notification-template.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Plantilla HTML y de Texto Plano para el "Modo Entrega Asistida de PIN".
 * Se despacha al correo administrativo configurado cuando un motociclista
 * registra su cuenta vinculada a un folio físico (SAFE-XXXX).
 *
 * Contiene:
 * 1. Baliza visual y estética oficial Incident 2026.
 * 2. Datos completos del cliente registrado: Nombre, Correo y Celular.
 * 3. Folio del kit escaneado (NFC/QR).
 * 4. Bloque monoespaciado de PIN de alto contraste optimizado para copiar con 1 toque.
 * 5. Botón directo de WhatsApp pre-configurado para enviar el PIN al cliente en 1 clic.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 280 líneas).
 * - Cero textos hardcodeados de cliente: 100% dinámico.
 * - CSS en línea para compatibilidad universal (Gmail, Outlook, iOS Mail).
 * ==============================================================================
 */

import { formatE164Phone } from "@/services/whatsapp.service";

export interface AdminPinNotificationData {
  adminEmail: string;
  fullName: string;
  riderEmail: string;
  riderPhone: string;
  deviceCode: string;
  pin: string;
  locale?: "es" | "en";
}

/**
 * Genera el correo HTML y texto plano de alerta administrativa de PIN de activación.
 */
export function buildAdminPinNotificationEmail(data: AdminPinNotificationData): {
  subject: string;
  html: string;
  text: string;
} {
  const isEn = data.locale === "en";
  const cleanPhone = formatE164Phone(data.riderPhone || "");
  const firstName = data.fullName.split(" ")[0] || data.fullName;

  // Enlace directo a WhatsApp con mensaje pre-cargado
  const whatsappMessage = encodeURIComponent(
    isEn
      ? `Hello ${firstName}, your SAFE activation PIN for kit ${data.deviceCode} is: ${data.pin}. Enter it in your dashboard to activate your helmet.`
      : `Hola ${firstName}, tu código PIN de activación SAFE para tu kit ${data.deviceCode} es: ${data.pin}. Ingrésalo en tu panel para activar tu casco.`,
  );
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${whatsappMessage}`
    : "";

  const subject = isEn
    ? `🔑 SAFE ADMIN: Activation PIN for ${data.deviceCode} (${data.fullName})`
    : `🔑 SAFE ADMIN: PIN de Activación para ${data.deviceCode} (${data.fullName})`;

  const html = `<!DOCTYPE html>
<html lang="${isEn ? "en" : "es"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0B1F3A; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #D7E3F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(11, 31, 58, 0.06);">
          
          <!-- Encabezado Editorial Incident -->
          <tr>
            <td style="background-color: #0B1F3A; padding: 28px 24px; text-align: left; border-bottom: 3px solid #FF5138;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #15365B; border: 1px solid #2F648F; border-radius: 6px; padding: 4px 10px; margin-bottom: 12px;">
                      <span style="font-family: monospace; font-size: 11px; font-weight: bold; color: #FF5138; text-transform: uppercase; letter-spacing: 2px;">
                        ⛑️ SAFE · ${isEn ? "ASSISTED ACTIVATION PROTOCOL" : "PROTOCOLO DE ACTIVACIÓN ASISTIDA"}
                      </span>
                    </div>
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; line-height: 1.25; font-weight: bold; color: #FFFFFF;">
                      ${isEn ? "Kit Registered — PIN Ready to Share" : "Kit Registrado — PIN Listo para Compartir"}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #23466D;">
                ${
                  isEn
                    ? `A rider has just scanned their kit and registered their account. Since <strong>Assisted PIN Dispatch Mode</strong> is active, their confidential PIN is held in your custody for personal delivery:`
                    : `Un motociclista acaba de escanear su kit y registrar su cuenta. Dado que el <strong>Modo Entrega Asistida de PIN</strong> está activo, su PIN confidencial se encuentra bajo tu custodia para entrega personalizada:`
                }
              </p>

              <!-- Tarjeta de Datos del Motociclista -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #D7E3F0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #5C718A; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
                      ${isEn ? "RIDER DETAILS" : "DATOS DEL MOTOCICLISTA REGISTRADO"}
                    </div>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #5C718A; width: 110px;">${isEn ? "Full Name:" : "Nombre:"}</td>
                        <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #0B1F3A;">${data.fullName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #5C718A;">${isEn ? "Email:" : "Correo:"}</td>
                        <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #0B1F3A;">
                          <a href="mailto:${data.riderEmail}" style="color: #2F648F; text-decoration: none;">${data.riderEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #5C718A;">${isEn ? "Phone / WA:" : "Teléfono / WA:"}</td>
                        <td style="padding: 4px 0; font-size: 14px; font-weight: 600; color: #0B1F3A;">
                          <a href="tel:${data.riderPhone}" style="color: #2F648F; text-decoration: none;">${data.riderPhone || (isEn ? "Not provided" : "No especificado")}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #5C718A;">${isEn ? "Kit Folio:" : "Folio del Kit:"}</td>
                        <td style="padding: 4px 0; font-family: monospace; font-size: 14px; font-weight: bold; color: #FF5138;">${data.deviceCode}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- BLOQUE DESTACADO: PIN DE ACTIVACIÓN PARA COPIAR -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B1F3A; border: 2px solid #FF5138; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                <tr>
                  <td style="padding: 24px 20px;">
                    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #FF5138; margin-bottom: 8px;">
                      🔑 ${isEn ? "CONFIDENTIAL ACTIVATION PIN" : "PIN CONFIDENCIAL DE ACTIVACIÓN"}
                    </div>
                    
                    <!-- Código PIN en grande para copiar fácil con 1 toque -->
                    <div style="background-color: #15365B; border: 1px dashed #2F648F; border-radius: 8px; padding: 14px 20px; display: inline-block; margin: 8px auto;">
                      <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 900; letter-spacing: 12px; color: #FFFFFF; user-select: all; -webkit-user-select: all;">
                        ${data.pin}
                      </span>
                    </div>

                    <div style="font-size: 12px; color: #D7E3F0; margin-top: 10px;">
                      📋 ${isEn ? "Touch / double-click the code above to copy it directly." : "Toca o selecciona el código de arriba para copiarlo al portapapeles."}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- BOTÓN DE ACCIÓN DIRECTA: ENVIAR POR WHATSAPP -->
              ${
                whatsappUrl
                  ? `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; max-width: 440px; background-color: #25D366; color: #FFFFFF; font-size: 15px; font-weight: bold; text-align: center; text-decoration: none; padding: 14px 24px; border-radius: 10px; box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);">
                      💬 ${isEn ? `Send PIN via WhatsApp to ${firstName}` : `Enviar PIN por WhatsApp a ${firstName}`}
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Botón Alternativo de Correo -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${data.riderEmail}?subject=${encodeURIComponent(
                      isEn
                        ? `Your SAFE Activation PIN (${data.deviceCode})`
                        : `Tu PIN de Activación SAFE (${data.deviceCode})`,
                    )}&body=${encodeURIComponent(
                      isEn
                        ? `Hello ${firstName},\n\nYour 6-digit activation PIN for kit ${data.deviceCode} is: ${data.pin}\n\nEnter it in your dashboard to activate your helmet.\n\nSAFE Support`
                        : `Hola ${firstName},\n\nTu PIN de 6 dígitos para activar tu kit ${data.deviceCode} es: ${data.pin}\n\nIngrésalo en tu panel para activar tu casco.\n\nSoporte SAFE`,
                    )}" style="display: inline-block; background-color: #F8FAFC; border: 1px solid #D7E3F0; color: #0B1F3A; font-size: 13px; font-weight: 600; text-align: center; text-decoration: none; padding: 10px 20px; border-radius: 8px;">
                      ✉️ ${isEn ? "Send PIN via Email" : "Enviar PIN por Correo Electrónico"}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #5C718A; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 16px;">
                ${
                  isEn
                    ? "This alert was generated automatically because Assisted PIN Mode is enabled in the Admin Console."
                    : "Esta alerta fue generada automáticamente porque el Modo Entrega Asistida de PIN está activado en la Consola Administrativa."
                }
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #D7E3F0; padding: 16px 24px; text-align: center;">
              <span style="font-size: 11px; font-weight: 600; color: #5C718A;">
                SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = isEn
    ? `SAFE ADMIN — ASSISTED ACTIVATION PROTOCOL
--------------------------------------------------
Kit Registered: ${data.deviceCode}
Rider: ${data.fullName}
Email: ${data.riderEmail}
Phone: ${data.riderPhone || "Not provided"}

CONFIDENTIAL ACTIVATION PIN: ${data.pin}

${whatsappUrl ? `WhatsApp Direct Link:\n${whatsappUrl}\n\n` : ""}
Instructions:
Share this 6-digit PIN with the rider so they can complete kit activation in their dashboard.

SAFE Automated Admin Notification`
    : `SAFE ADMIN — PROTOCOLO DE ACTIVACIÓN ASISTIDA
--------------------------------------------------
Kit Registrado: ${data.deviceCode}
Motociclista: ${data.fullName}
Correo: ${data.riderEmail}
Teléfono: ${data.riderPhone || "No especificado"}

PIN CONFIDENCIAL DE ACTIVACIÓN: ${data.pin}

${whatsappUrl ? `Enlace Directo WhatsApp:\n${whatsappUrl}\n\n` : ""}
Instrucciones:
Comparte este PIN de 6 dígitos con el motociclista para que complete la activación de su casco en el panel.

Notificación Administrativa Automática SAFE`;

  return { subject, html, text };
}
