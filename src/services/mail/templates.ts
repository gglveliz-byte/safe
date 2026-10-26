/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Servicios de Avisos — Motor de Plantillas de Correo (Capa Servicios)
 * ARCHIVO: src/services/mail/templates.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Genera el asunto (literal §11 de `docs/BACKEND_CONTRACTS.md`, CONGELADO), el
 * documento HTML bilingüe —bloque en español arriba y bloque en inglés debajo,
 * separados por una línea capilar— y la versión en texto plano del aviso médico
 * que despacha `src/services/mail.service.ts` cuando alguien escanea el casco
 * del motociclista en carretera. Todo valor interpolado proviene de texto libre
 * almacenado en PostgreSQL (nombres, alergias, folios) y se sanea con
 * `escapeHtml` para impedir inyección de etiquetas dentro del correo.
 * Estética obligatoria "Incident — Technical broadsheet on concrete": lienzo
 * concreto #efefef, tarjetas papel #ffffff, tinta #000000, baliza Signal
 * Orange #f25533, rojo de alerta #ff492c, ember #f1641e; titulares Times New
 * Roman serif 24px peso 700, microetiquetas Arial 13px, botón neutro enmarcado
 * con borde 1px sólido, cero gradientes y sombras ultraligeras de 2 % a 4 %.
 * ENTRADAS: EmergencyEmailPayload, locale "es" | "en" y nombre opcional del
 * destinatario. SALIDAS: EmailContent { subject, html, text } para Nodemailer.
 * DEPENDENCIAS: ninguna externa (plantilla pura: cero red, cero base de datos).
 * LEYES DE INGENIERÍA: < 500 líneas · cero datos hardcodeados (todo dato es
 * dinámico; aquí solo vive texto editorial) · bilingüismo ES/EN en el mismo
 * correo (§11) · comentarios explicativos en Español en cada función.
 * ==============================================================================
 */

/** Ficha dinámica de la alerta, producida por `emergency-alert.service.ts`. */
export interface EmergencyEmailPayload {
  /** Nombre completo del piloto titular del casco escaneado. */
  riderName: string;
  /** Grupo y factor sanguíneo declarado (p. ej. "O+"). */
  bloodType: string;
  /** Alergias médicas declaradas; `null` equivale a "No declarado". */
  allergies: string | null;
  /** Enfermedades crónicas declaradas; `null` equivale a "No declarado". */
  chronicConditions: string | null;
  /** Medicación en uso declarada; `null` equivale a "No declarado". */
  medications: string | null;
  /** Coordenada sexagesimal DMS legible producida por el servicio GPS. */
  dmsFormatted: string;
  /** URL oficial de Google Maps con el pin exacto del siniestro. */
  googleMapsUrl: string;
  /** Momento UTC del escaneo que disparó la alerta. */
  scannedAt: Date;
  /** Folio público del registro de alerta (UUID de `EmergencyAlert`). */
  alertId: string;
}

/** Trío de representaciones del aviso para Nodemailer (cliente elige formato). */
export interface EmailContent {
  /** Asunto mostrado en la bandeja de entrada (literal §11). */
  subject: string;
  /** Documento HTML bilingüe con diseño Incident. */
  html: string;
  /** Versión en texto plano bilingüe, sin escapes HTML. */
  text: string;
}

/** Pares carácter → entidad, en orden estricto: `&` debe escapar primero. */
const HTML_ENTITIES: ReadonlyArray<readonly [string, string]> = [["&", "&amp;"], ["<", "&lt;"], [">", "&gt;"], ['"', "&quot;"], ["'", "&#39;"]];

/**
 * Sanea texto libre para incrustarlo con seguridad dentro del HTML del correo.
 * Los datos clínicos los escribe el usuario, así que nunca se confía en ellos.
 */
export function escapeHtml(value: string): string {
  return HTML_ENTITIES.reduce(
    (escaped, [character, entity]) => escaped.split(character).join(entity),
    value,
  );
}

/* Paleta oficial Incident (tokens §11): lienzo, papel, tinta y acentos planos. */
const COLOR_CONCRETE = "#efefef";
const COLOR_PAPER = "#ffffff";
const COLOR_INK = "#000000";
const COLOR_SIGNAL = "#f25533";
const COLOR_ALERT = "#ff492c";
const COLOR_EMBER = "#f1641e";
const COLOR_HAIRLINE = "#dadada";
/** Lavado rojizo del banner crítico (#ff492c al 8 % sobre papel), plano. */
const COLOR_ALERT_WASH = "#fff0ee";

/* Tipografía bimodal obligatoria: Times serif editorial + Arial 13px funcional. */
const FONT_TIMES = "'Times New Roman', Times, Georgia, serif";
const FONT_ARIAL = "Arial, Helvetica, sans-serif";

/** Sombra ultraligera permitida (opacidades de 2 % y 4 %, nunca negra pesada). */
const CARD_SHADOW =
  "0 8px 15px -3px rgba(22,22,24,0.02), 0 4px 6px -2px rgba(22,22,24,0.04)";

/** Formateadores legibles de la hora UTC del escaneo, uno por idioma. */
const UTC_READABLE_FORMAT: Record<"es" | "en", Intl.DateTimeFormat> = {
  es: new Intl.DateTimeFormat("es", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }),
};

/**
 * Diccionario editorial de un bloque de idioma del correo: solo texto de la
 * plantilla (etiquetas y avisos); ningún dato de negocio vive en esta capa.
 */
interface BlockCopy {
  blockTag: string;
  kicker: string;
  fallbackGreeting: string;
  /** Titular Times 24px/700 con el nombre dinámico del piloto. */
  headlineFor: (riderName: string) => string;
  /** Párrafo introductorio explicando el escaneo del casco. */
  lead: string;
  labelRider: string;
  labelBlood: string;
  labelAllergies: string;
  labelChronic: string;
  labelMedications: string;
  labelCoordinates: string;
  labelTime: string;
  labelFolio: string;
  labelMaps: string;
  /** Texto del botón neutro hacia Google Maps (literal §11 / §5.3). */
  button: string;
  /** Instrucción de auxilio: teléfono local primero, traslado después. */
  callHelp: string;
  /** Nota de pie de bloque: aviso automático, no responder. */
  footerNote: string;
  /** Rótulo cuando un campo clínico opcional viene vacío desde la BD. */
  notDeclared: string;
  /** Mensaje destacado cuando la ubicación satelital está pendiente o en reintento. */
  gpsPendingNotice: string;
  /** Encabezado de alerta cuando las coordenadas están pendientes. */
  gpsPendingWarning: string;
}

/** Diccionario bilingüe de la plantilla (ES primero, EN después, siempre). */
const BLOCK_COPY: Record<"es" | "en", BlockCopy> = {
  es: {
    blockTag: "ESPAÑOL",
    kicker: "ALERTA MÉDICA DE EMERGENCIA · REGISTRO PROTEGIDO",
    fallbackGreeting: "Familiares y contactos de emergencia:",
    headlineFor: (riderName) => `El casco de ${riderName} fue escaneado en carretera`,
    lead: "Alguien escaneó la antena médica del casco de este motociclista, lo que puede indicar una emergencia en la carretera. Compartimos su ficha clínica resumida y su ubicación exacta para orientar la ayuda.",
    labelRider: "Nombre del piloto",
    labelBlood: "Tipo de sangre",
    labelAllergies: "Alergias",
    labelChronic: "Enfermedades crónicas",
    labelMedications: "Medicación",
    labelCoordinates: "Coordenada exacta (DMS)",
    labelTime: "Hora del escaneo (UTC)",
    labelFolio: "Folio de alerta",
    labelMaps: "Enlace de ubicación",
    button: "ABRIR UBICACIÓN EXACTA EN GOOGLE MAPS",
    callHelp: "Llame primero al número de auxilio local (ambulancia y policía) antes de trasladar al piloto. No lo mueva si hay sospecha de lesión cervical.",
    footerNote: "Aviso automático generado por SAFE cuando el casco fue escaneado. No responda a este correo.",
    notDeclared: "No declarado",
    gpsPendingNotice: "⚠️ Ubicación satelital no transmitida en el escaneo inicial. Estamos recolectando las coordenadas automáticamente lo más pronto posible. Mantente atento: el sistema está reintentando.",
    gpsPendingWarning: "UBICACIÓN SATELITAL PENDIENTE — REINTENTANDO ADQUISICIÓN",
  },
  en: {
    blockTag: "ENGLISH",
    kicker: "EMERGENCY MEDICAL ALERT · PROTECTED RECORD",
    fallbackGreeting: "Emergency family members and contacts:",
    headlineFor: (riderName) => `${riderName}'s helmet was scanned on route`,
    lead: "Someone scanned the medical tag of this rider's helmet, which may indicate a road emergency. Their summarized clinical record and exact location are shared below to guide assistance.",
    labelRider: "Rider name",
    labelBlood: "Blood type",
    labelAllergies: "Allergies",
    labelChronic: "Chronic conditions",
    labelMedications: "Medications",
    labelCoordinates: "Exact coordinate (DMS)",
    labelTime: "Scan time (UTC)",
    labelFolio: "Alert folio",
    labelMaps: "Location link",
    button: "OPEN EXACT LOCATION IN GOOGLE MAPS",
    callHelp: "Call your local emergency number (ambulance and police) before moving the rider. Do not move them if a neck injury is suspected.",
    footerNote: "Automatic notice generated by SAFE when the helmet was scanned. Please do not reply to this email.",
    notDeclared: "Not declared",
    gpsPendingNotice: "⚠️ Satellite location not transmitted in initial scan. We are acquiring coordinates automatically as soon as possible. Stay alert: the system is retrying.",
    gpsPendingWarning: "SATELLITE LOCATION PENDING — RETRYING ACQUISITION",
  },
};

/**
 * Asunto literal del contrato §11 (CONGELADO) en el idioma del aviso. El
 * nombre crudo no se escapa: los asuntos de correo no admiten HTML.
 */
function buildSubject(riderName: string, locale: "es" | "en"): string {
  const name = resolveRiderName(riderName, locale);
  return locale === "es"
    ? `🚨 ALERTA MÉDICA SAFE: Casco de ${name} escaneado en carretera`
    : `🚨 SAFE EMERGENCY ALERT: ${name}'s helmet scanned on route`;
}

/** Nombre visible del piloto, con rótulo genérico de respaldo por idioma. */
function resolveRiderName(riderName: string, language: "es" | "en"): string {
  return riderName.trim() || (language === "es" ? "Motociclista SAFE" : "SAFE rider");
}

/** Devuelve la hora del escaneo en texto legible y en ISO 8601 UTC. */
function formatScanTime(scannedAt: Date, language: "es" | "en"): string {
  const readable = UTC_READABLE_FORMAT[language].format(scannedAt);
  return `${readable} UTC · ${scannedAt.toISOString()}`;
}

/** Campo clínico opcional: `null` o vacío se muestra "No declarado" / "Not declared". */
function clinicalValue(value: string | null, notDeclared: string): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : notDeclared;
}

/** Saludo personalizado del bloque ("Hola, X" / "Hello, X") o coletilla general. */
function greetingFor(copy: BlockCopy, language: "es" | "en", recipientName?: string): string {
  const trimmed = recipientName?.trim();
  if (!trimmed) return copy.fallbackGreeting;
  return `${language === "es" ? "Hola" : "Hello"}, ${trimmed}:`;
}

/** Fila etiqueta/valor de la tabla técnica; el valor se escapa aquí siempre. */
function renderDataRow(label: string, value: string): string {
  return (
    `<tr><td style="padding:10px 14px;border-bottom:1px solid ${COLOR_HAIRLINE};font-family:${FONT_ARIAL};font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${COLOR_INK};width:210px;">${escapeHtml(label)}</td>` +
    `<td style="padding:10px 14px;border-bottom:1px solid ${COLOR_HAIRLINE};font-family:${FONT_TIMES};font-size:16px;color:${COLOR_INK};">${escapeHtml(value)}</td></tr>`
  );
}

/** Fila con el enlace crudo a Google Maps, visible para clientes sin CSS. */
function renderAnchorRow(label: string, url: string): string {
  const safeUrl = escapeHtml(url);
  return (
    `<tr><td style="padding:10px 14px;border-bottom:1px solid ${COLOR_HAIRLINE};font-family:${FONT_ARIAL};font-size:13px;text-transform:uppercase;letter-spacing:1px;color:${COLOR_INK};width:210px;">${escapeHtml(label)}</td>` +
    `<td style="padding:10px 14px;border-bottom:1px solid ${COLOR_HAIRLINE};font-family:${FONT_ARIAL};font-size:13px;word-break:break-all;"><a href="${safeUrl}" style="color:${COLOR_INK};text-decoration:underline;">${safeUrl}</a></td></tr>`
  );
}

/** Botón neutro Incident: fondo #efefef, borde 1px #000000, radio 4px, Arial 13px. */
function renderMapsButton(copy: BlockCopy, googleMapsUrl: string): string {
  return (
    `<a href="${escapeHtml(googleMapsUrl)}" style="display:inline-block;background-color:${COLOR_CONCRETE};border:1px solid ${COLOR_INK};border-radius:4px;padding:14px 22px;font-family:${FONT_ARIAL};font-size:13px;font-weight:400;color:${COLOR_INK};text-decoration:none;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(copy.button)}</a>`
  );
}

/**
 * Bloque HTML de un idioma: saludo, titular Times 24px/700 sobre banner crítico
 * lavado, párrafo guía, tabla técnica, botón neutro y aviso de auxilio. Todos
 * los interpolados dinámicos pasan obligatoriamente por `escapeHtml`.
 */
function renderHtmlBlock(
  language: "es" | "en",
  payload: EmergencyEmailPayload,
  recipientName?: string,
): string {
  const copy = BLOCK_COPY[language];
  const rider = resolveRiderName(payload.riderName, language);
  const hasGps = Boolean(payload.googleMapsUrl && payload.googleMapsUrl !== "#" && payload.googleMapsUrl.trim().length > 0);
  const rows = [
    renderDataRow(copy.labelRider, rider),
    renderDataRow(copy.labelBlood, payload.bloodType),
    renderDataRow(copy.labelAllergies, clinicalValue(payload.allergies, copy.notDeclared)),
    renderDataRow(copy.labelChronic, clinicalValue(payload.chronicConditions, copy.notDeclared)),
    renderDataRow(copy.labelMedications, clinicalValue(payload.medications, copy.notDeclared)),
    renderDataRow(copy.labelCoordinates, payload.dmsFormatted),
    renderDataRow(copy.labelTime, formatScanTime(payload.scannedAt, language)),
    renderDataRow(copy.labelFolio, payload.alertId),
    hasGps
      ? renderAnchorRow(copy.labelMaps, payload.googleMapsUrl)
      : renderDataRow(copy.labelMaps, copy.gpsPendingWarning),
  ].join("");

  const mapsSection = hasGps
    ? `<p style="margin:0 0 16px;text-align:center;">${renderMapsButton(copy, payload.googleMapsUrl)}</p>`
    : `<div style="margin:0 0 16px;padding:14px 18px;background-color:${COLOR_ALERT_WASH};border:2px dashed ${COLOR_SIGNAL};border-radius:8px;text-align:center;">` +
      `<p style="margin:0 0 6px;font-family:${FONT_ARIAL};font-size:13px;font-weight:700;letter-spacing:1px;color:${COLOR_SIGNAL};text-transform:uppercase;">${escapeHtml(copy.gpsPendingWarning)}</p>` +
      `<p style="margin:0;font-family:${FONT_TIMES};font-size:15px;line-height:1.4;color:${COLOR_INK};">${escapeHtml(copy.gpsPendingNotice)}</p>` +
      `</div>`;

  return (
    `<div lang="${language}">` +
    `<p style="margin:0 0 8px;font-family:${FONT_ARIAL};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${COLOR_INK};">${escapeHtml(copy.blockTag)}</p>` +
    `<p style="margin:0 0 14px;font-family:${FONT_TIMES};font-size:16px;color:${COLOR_INK};">${escapeHtml(greetingFor(copy, language, recipientName))}</p>` +
    `<div style="margin:0 0 16px;padding:16px 18px;background-color:${COLOR_ALERT_WASH};border:1px solid ${COLOR_ALERT};border-radius:8px;">` +
    `<p style="margin:0;font-family:${FONT_TIMES};font-size:24px;font-weight:700;line-height:1.2;color:${COLOR_INK};">${escapeHtml(copy.headlineFor(rider))}</p></div>` +
    `<p style="margin:0 0 18px;font-family:${FONT_TIMES};font-size:16px;line-height:1.4;color:${COLOR_INK};">${escapeHtml(copy.lead)}</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${COLOR_PAPER};border:1px solid ${COLOR_EMBER};border-radius:12px;margin:0 0 18px;">${rows}</table>` +
    mapsSection +
    `<p style="margin:0 0 14px;padding:12px 14px;background-color:${COLOR_CONCRETE};border-left:3px solid ${COLOR_SIGNAL};font-family:${FONT_TIMES};font-size:16px;line-height:1.4;color:${COLOR_INK};">${escapeHtml(copy.callHelp)}</p>` +
    `<p style="margin:0;font-family:${FONT_ARIAL};font-size:13px;color:${COLOR_INK};">${escapeHtml(copy.footerNote)}</p>` +
    `</div>`
  );
}

/**
 * Documento HTML completo: lienzo de concreto, tarjeta papel con baliza Signal
 * Orange en la cúspide, bloque ES arriba, separador capilar bilingüe y bloque
 * EN debajo, con pie técnico que repite el folio de la alerta.
 */
function renderHtmlDocument(
  payload: EmergencyEmailPayload,
  locale: "es" | "en",
  recipientName?: string,
): string {
  return (
    `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
    `<title>SAFE · Alerta médica / Medical alert</title></head>` +
    `<body style="margin:0;padding:0;background-color:${COLOR_CONCRETE};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR_CONCRETE};"><tr><td align="center" style="padding:24px 12px;">` +
    `<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background-color:${COLOR_PAPER};border:1px solid ${COLOR_INK};border-radius:12px;box-shadow:${CARD_SHADOW};">` +
    `<tr><td style="background-color:${COLOR_SIGNAL};height:4px;line-height:4px;font-size:4px;">&nbsp;</td></tr>` +
    `<tr><td style="padding:18px 24px;background-color:${COLOR_CONCRETE};border-bottom:1px solid ${COLOR_INK};">` +
    `<span style="font-family:${FONT_TIMES};font-size:24px;font-weight:700;letter-spacing:4px;color:${COLOR_INK};">SAFE</span>` +
    `<span style="display:block;margin-top:6px;font-family:${FONT_ARIAL};font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${COLOR_INK};">${escapeHtml(BLOCK_COPY[locale].kicker)}</span>` +
    `</td></tr>` +
    `<tr><td style="padding:24px;">${renderHtmlBlock("es", payload, recipientName)}</td></tr>` +
    `<tr><td style="padding:0 24px;"><div style="border-top:1px solid ${COLOR_INK};padding-top:10px;font-family:${FONT_ARIAL};font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${COLOR_INK};">Aviso completo también en inglés · Full notice in Spanish above</div></td></tr>` +
    `<tr><td style="padding:24px;border-top:1px solid ${COLOR_HAIRLINE};">${renderHtmlBlock("en", payload, recipientName)}</td></tr>` +
    `<tr><td style="padding:14px 24px;background-color:${COLOR_CONCRETE};border-top:1px solid ${COLOR_INK};font-family:${FONT_ARIAL};font-size:13px;color:${COLOR_INK};">SAFE · Registro médico de emergencia protegido · Protected emergency medical record · Folio / Alert ID: ${escapeHtml(payload.alertId)}</td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}

/** Bloque en texto plano (clientes sin HTML): mismo contenido, cero escapes. */
function renderTextBlock(
  language: "es" | "en",
  payload: EmergencyEmailPayload,
  recipientName?: string,
): string {
  const copy = BLOCK_COPY[language];
  const rider = resolveRiderName(payload.riderName, language);
  const hasGps = Boolean(payload.googleMapsUrl && payload.googleMapsUrl !== "#" && payload.googleMapsUrl.trim().length > 0);
  return [
    `[${copy.blockTag}]`,
    greetingFor(copy, language, recipientName),
    copy.headlineFor(rider),
    copy.lead,
    `${copy.labelRider}: ${rider}`,
    `${copy.labelBlood}: ${payload.bloodType}`,
    `${copy.labelAllergies}: ${clinicalValue(payload.allergies, copy.notDeclared)}`,
    `${copy.labelChronic}: ${clinicalValue(payload.chronicConditions, copy.notDeclared)}`,
    `${copy.labelMedications}: ${clinicalValue(payload.medications, copy.notDeclared)}`,
    `${copy.labelCoordinates}: ${payload.dmsFormatted}`,
    `${copy.labelTime}: ${formatScanTime(payload.scannedAt, language)}`,
    `${copy.labelFolio}: ${payload.alertId}`,
    hasGps
      ? `${copy.button}: ${payload.googleMapsUrl}`
      : `[${copy.gpsPendingWarning}]\n${copy.gpsPendingNotice}`,
    copy.callHelp,
    copy.footerNote,
  ].join("\n");
}

/** Ensambla la versión en texto plano bilingüe separada por líneas capilares. */
function renderTextDocument(payload: EmergencyEmailPayload, recipientName?: string): string {
  const divider = "-".repeat(28);
  return [
    "SAFE - ALERTA MEDICA / EMERGENCY MEDICAL ALERT",
    "===============================================",
    renderTextBlock("es", payload, recipientName),
    divider,
    renderTextBlock("en", payload, recipientName),
    divider,
    `SAFE · Folio / Alert ID: ${payload.alertId}`,
  ].join("\n\n");
}

/**
 * Punto de entrada congelado por `docs/BACKEND_CONTRACTS.md` §8: compone el
 * EmailContent del aviso para un destinatario concreto. El asunto sigue el
 * `locale` recibido (§11) y cada bloque del documento saluda en su propio
 * idioma; el resto del correo es siempre bilingüe ES+EN en un mismo mensaje.
 *
 * @param payload Ficha dinámica de la alerta originada en la base de datos.
 * @param locale Idioma del asunto y del aviso prioritario ("es" | "en").
 * @param recipientName Nombre opcional del contacto para el saludo.
 * @returns Asunto, HTML bilingüe escapado y texto plano listos para Nodemailer.
 */
export function buildEmergencyEmailContent(
  payload: EmergencyEmailPayload,
  locale: "es" | "en",
  recipientName?: string,
): EmailContent {
  return {
    subject: buildSubject(payload.riderName, locale),
    html: renderHtmlDocument(payload, locale, recipientName),
    text: renderTextDocument(payload, recipientName),
  };
}
