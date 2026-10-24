/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Servicios de Localización, Geodesia y Enlaces de Emergencia
 * ARCHIVO: src/services/gps-maps.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Convierte coordenadas decimales GPS al formato sexagesimal (DMS) con precisión
 * de una décima de segundo, construye la URL oficial de Google Maps con el pin
 * exacto del siniestro y redacta el mensaje bilingüe (ES/EN) que se comparte por
 * WhatsApp con los seres queridos del motociclista o con los servicios de auxilio.
 *
 * Este servicio es la única fuente de verdad para la nomenclatura geográfica de
 * SAFE: las alertas de emergencia, los correos de Gmail y el panel del
 * motociclista consumen exclusivamente estos resultados.
 *
 * ENTRADAS: latitud y longitud decimales (WGS 84) y nombre del motociclista.
 * SALIDAS: cadena DMS, URL de Google Maps, URL de WhatsApp y texto bilingüe.
 * DEPENDENCIAS: ninguna externa (aritmética pura y APIs nativas de URL).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas por archivo.
 * - Cero datos hardcodeados, mocks o demos.
 * - Bilingüismo ES/EN obligatorio en el mensaje de auxilio.
 * - Comentarios explicativos en Español en cada función.
 * ==============================================================================
 */

/** Décimas de segundo contenidas en un grado completo (3.600 s × 10). */
const TENTHS_OF_SECOND_PER_DEGREE = 36000;

/** Décimas de segundo contenidas en un minuto completo (60 s × 10). */
const TENTHS_OF_SECOND_PER_MINUTE = 600;

/** Profundidad de cámara exigida por el contrato de Google Maps (744 m). */
const GOOGLE_MAPS_ZOOM_DEPTH = "744m";

/** Punto de entrada oficial de Google Maps para un lugar por nombre/DMS. */
const GOOGLE_MAPS_PLACE_ENDPOINT = "https://www.google.com/maps/place";

/** Punto de entrada oficial de WhatsApp para compartir texto pre-armado. */
const WHATSAPP_SHARE_ENDPOINT = "https://wa.me/?text=";

/** Nombre de respaldo cuando el perfil no aporta un nombre utilizable. */
const DEFAULT_RIDER_NAME = "Motociclista SAFE";

/** Longitud máxima del nombre que se incrusta en el mensaje de auxilio. */
const MAX_RIDER_NAME_LENGTH = 80;

/**
 * Datos listos para despachar una ubicación de emergencia desde el cliente.
 * Se construyen siempre en el servidor para que el enlace sea verificable y
 * no dependa de la precisión del dispositivo que escanea el casco.
 */
export interface GoogleMapsDirectData {
  /** Coordenada sexagesimal legible por un operador humano, p. ej. 2°10'06.9"N. */
  dmsFormatted: string;
  /** URL oficial de Google Maps con el pin exacto del siniestro. */
  googleMapsUrl: string;
  /** URL de WhatsApp con el texto de auxilio codificado. */
  whatsappShareUrl: string;
  /** Texto bilingüe listo para pegar en WhatsApp o en cualquier mensajería. */
  whatsappText: string;
}

/**
 * Verifica que las coordenadas sean números finitos dentro de los rangos
 * geográficos válidos. Lanza RangeError con mensaje humano en Español para que
 * la capa HTTP lo traduzca a VALIDATION_ERROR sin filtrar detalles internos.
 */
function assertValidCoordinates(latitude: number, longitude: number): void {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError("La latitud debe ser un número entre -90 y 90.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError("La longitud debe ser un número entre -180 y 180.");
  }
}

/**
 * Convierte un único componente decimal en grados, minutos y segundos.
 * Trabaja con décimas de segundo enteras para que el acarreo sea exacto:
 * 59,95 s asciende a un minuto completo y 59'59,95" asciende a un grado entero.
 * Rellena minutos y segundos con cero a la izquierda (06.9) y deja los grados
 * sin relleno, tal como exige la nomenclatura técnica del contrato.
 *
 * @param value Componente decimal ya validado (latitud o longitud).
 * @param positiveHemisphere Letra del hemisferio positivo (N o E).
 * @param negativeHemisphere Letra del hemisferio negativo (S o W).
 */
function toDmsComponent(
  value: number,
  positiveHemisphere: string,
  negativeHemisphere: string,
): string {
  // Se redondea a décimas de segundo antes de separar para evitar derivas binarias.
  const absoluteTenths = Math.round(Math.abs(value) * TENTHS_OF_SECOND_PER_DEGREE);
  const degrees = Math.floor(absoluteTenths / TENTHS_OF_SECOND_PER_DEGREE);
  const remainderTenths = absoluteTenths % TENTHS_OF_SECOND_PER_DEGREE;
  const minutes = Math.floor(remainderTenths / TENTHS_OF_SECOND_PER_MINUTE);
  const secondsTenths = remainderTenths % TENTHS_OF_SECOND_PER_MINUTE;
  const wholeSeconds = Math.floor(secondsTenths / 10);
  const decimalSeconds = secondsTenths % 10;
  const secondsLabel = `${String(wholeSeconds).padStart(2, "0")}.${decimalSeconds}`;
  const minutesLabel = String(minutes).padStart(2, "0");
  const hemisphere = value < 0 ? negativeHemisphere : positiveHemisphere;

  return `${degrees}°${minutesLabel}'${secondsLabel}"${hemisphere}`;
}

/**
 * Convierte una coordenada decimal a notación sexagesimal DMS.
 * Formato de salida: `LAT°MM'SS.s"H LNG°MM'SS.s"H` con hemisferios N/S y E/W.
 * El cero negativo se interpreta como hemisferio positivo (N/E).
 *
 * @param latitude Latitud decimal entre -90 y 90.
 * @param longitude Longitud decimal entre -180 y 180.
 * @returns Cadena DMS con una décima de segundo, p. ej. `2°10'06.9"N 79°27'10.6"W`.
 */
export function decimalToDMS(latitude: number, longitude: number): string {
  assertValidCoordinates(latitude, longitude);
  const latitudeDms = toDmsComponent(latitude, "N", "S");
  const longitudeDms = toDmsComponent(longitude, "E", "W");

  return `${latitudeDms} ${longitudeDms}`;
}

/**
 * Serializa una coordenada decimal sin notación científica ni ceros sobrantes
 * para incrustarla en la URL de Google Maps sin alterar la precisión recibida.
 */
function formatCoordinate(value: number): string {
  if (value === 0) {
    return "0";
  }

  const plain = String(value);
  if (!plain.includes("e")) {
    return plain;
  }

  return value
    .toFixed(10)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

/**
 * Construye la URL oficial de Google Maps definida en el contrato del backend:
 * place con la cadena DMS codificada, vista a 744 m y doble ancla decimal
 * (`!3dLAT!4dLNG`) para que el pin caiga exactamente sobre el siniestro.
 *
 * @param latitude Latitud decimal entre -90 y 90.
 * @param longitude Longitud decimal entre -180 y 180.
 * @returns URL https de Google Maps lista para correos y mensajería.
 */
export function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  assertValidCoordinates(latitude, longitude);
  const dmsEncoded = encodeURIComponent(decimalToDMS(latitude, longitude));
  const latitudeText = formatCoordinate(latitude);
  const longitudeText = formatCoordinate(longitude);

  return (
    `${GOOGLE_MAPS_PLACE_ENDPOINT}/${dmsEncoded}` +
    `/@${latitudeText},${longitudeText},${GOOGLE_MAPS_ZOOM_DEPTH}` +
    `/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d${latitudeText}!4d${longitudeText}`
  );
}

/**
 * Limpia el nombre del motociclista para evitar saltos de línea, caracteres de
 * control o textos desmedidos dentro del mensaje de emergencia. Si el valor no
 * es utilizable, devuelve un nombre genérico en Español.
 */
function normalizeRiderName(riderName: string): string {
  if (typeof riderName !== "string") {
    return DEFAULT_RIDER_NAME;
  }

  const cleaned = riderName
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length === 0) {
    return DEFAULT_RIDER_NAME;
  }

  return cleaned.slice(0, MAX_RIDER_NAME_LENGTH);
}

/**
 * Redacta el mensaje de auxilio bilingüe (Español e Inglés) con la baliza de
 * emergencia, la coordenada DMS y el enlace oficial de Google Maps. El texto se
 * comparte tal cual por WhatsApp para que un familiar o un paramédico lo lea en
 * un solo toque, sin depender del idioma del dispositivo que lo recibe.
 */
function buildEmergencyMessage(
  displayName: string,
  dmsFormatted: string,
  googleMapsUrl: string,
): string {
  return [
    "🚨 *BALIZA DE EMERGENCIA SAFE / SAFE EMERGENCY BEACON* 🚨",
    "",
    `*ES:* El casco de ${displayName} fue escaneado en carretera y requiere auxilio inmediato.`,
    `*EN:* ${displayName}'s helmet was scanned on route and needs immediate assistance.`,
    "",
    `📍 *DMS:* ${dmsFormatted}`,
    `🗺️ *Google Maps:* ${googleMapsUrl}`,
    "",
    "*ES:* Comparte esta ubicación con los servicios de emergencia y con la familia.",
    "*EN:* Share this location with emergency services and family.",
    "",
    "*SAFE* — Ficha médica de emergencia / Emergency medical record",
  ].join("\n");
}

/**
 * Prepara el paquete completo de ubicación directa para una alerta: coordenada
 * sexagesimal, enlace oficial de Google Maps, enlace de WhatsApp y texto
 * bilingüe. Es el punto de entrada que consumen el despacho de emergencias y la
 * ficha pública del casco.
 *
 * @param latitude Latitud decimal entre -90 y 90.
 * @param longitude Longitud decimal entre -180 y 180.
 * @param riderName Nombre del motociclista para personalizar el aviso.
 * @returns Objeto inmutable con los cuatro artefactos de ubicación.
 */
export function buildGoogleMapsDirectData(
  latitude: number,
  longitude: number,
  riderName: string,
): GoogleMapsDirectData {
  assertValidCoordinates(latitude, longitude);
  const dmsFormatted = decimalToDMS(latitude, longitude);
  const googleMapsUrl = buildGoogleMapsUrl(latitude, longitude);
  const displayName = normalizeRiderName(riderName);
  const whatsappText = buildEmergencyMessage(displayName, dmsFormatted, googleMapsUrl);
  const whatsappShareUrl = `${WHATSAPP_SHARE_ENDPOINT}${encodeURIComponent(whatsappText)}`;

  return {
    dmsFormatted,
    googleMapsUrl,
    whatsappShareUrl,
    whatsappText,
  };
}
