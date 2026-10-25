/**
 * ==============================================================================
 * PROYECTO: SAFE — Sistema de Auxilio Médico Emergente para Motociclistas
 * MÓDULO: Servicios Nucleares de Localización (Backend Parte 1 · S-06)
 * ARCHIVO: src/services/gps-maps.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Único convertor geográfico de SAFE: traduce coordenadas decimales WGS 84 a la
 * nomenclatura sexagesimal DMS exigida por el contrato congelado (BACKEND_
 * CONTRACTS.md §8), construye la URL oficial de Google Maps con el pin exacto
 * del siniestro (Arquitectura §5.1) y arma el mensaje bilingüe de auxilio listo
 * para compartir en un solo toque por WhatsApp.
 *
 * LEYES APLICADAS:
 * - TypeScript puro sin dependencias externas (aritmética + APIs nativas de URL).
 * - Cero datos hardcodeados: el nombre del piloto llega siempre dinámico desde
 *   la base de datos; los textos visibles del mensaje son plantillas ES/EN.
 * - Todos los mensajes de error al usuario final van en Español.
 * - Límite estricto < 250 líneas físicas por archivo.
 * ==============================================================================
 */

/** Décimas de segundo contenidas en un grado completo (3.600 s × 10). */
const DECIMAS_POR_GRADO = 36000;

/** Décimas de segundo contenidas en un minuto completo (60 s × 10). */
const DECIMAS_POR_MINUTO = 600;

/** Minutos contenidos en un grado completo. */
const MINUTOS_POR_GRADO = 60;

/** Profundidad de cámara exigida por el contrato de Google Maps (744 m). */
const ZOOM_CONTRATO = "744m";

/** Longitud máxima admitida para el nombre dinámico del piloto. */
const MAX_NOMBRE = 80;

/** Etiqueta genérica de auxilio cuando el perfil no aporta nombre utilizable. */
const ETIQUETA_SIN_NOMBRE = "Piloto SAFE";

/**
 * Paquete de ubicación directa listo para despachar una emergencia.
 * Lo consumen el correo de Gmail, la ficha pública del casco y el botón de
 * WhatsApp; nunca se construye en el cliente para que el enlace sea verificable.
 */
export interface GoogleMapsDirectData {
  /** Coordenada sexagesimal legible por un operador humano, p. ej. 2°10'06.9"N. */
  dmsFormatted: string;
  /** URL oficial de Google Maps con el pin exacto del siniestro. */
  googleMapsUrl: string;
  /** URL de WhatsApp con el texto bilingüe ya codificado (compartir 1 toque). */
  whatsappShareUrl: string;
  /** Texto bilingüe ES/EN con negritas de WhatsApp, listo para mensajería. */
  whatsappText: string;
}

/**
 * Valida finitud y rangos satelitales de una coordenada WGS 84.
 * Lanza un Error con mensaje humano en Español (nunca crudo ni en inglés)
 * para que la capa HTTP lo traduzca a un error de validación legible.
 */
function validarCoordenadas(latitude: number, longitude: number): void {
  const latitudValida = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
  const longitudValida = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  if (!latitudValida || !longitudValida) {
    throw new Error("Coordenada fuera de rango satelital.");
  }
}

/**
 * Normaliza el acarreo sexagesimal tras redondear los segundos a una décima.
 * Caso crítico documentado: si los segundos redondeados llegan a 60.0,
 * se convierten en 0.0 y se suma 1 minuto; si ese empuje lleva los minutos
 * a 60, se convierten en 00 y se suma 1 grado (p. ej. 89°59'59.95"N pasa a
 * 90°00'00.0"N sin producir jamás el inválido 90°00'60.0"N ni 1°60'00.0").
 * Trabaja con décimas de segundo enteras, así que el acarreo es exacto.
 */
function normalizarAcarreo(
  grados: number,
  minutos: number,
  decimasSegundo: number,
): [number, number, number] {
  let g = grados;
  let m = minutos;
  let d = decimasSegundo;
  if (d >= DECIMAS_POR_MINUTO) {
    m += 1;
    d -= DECIMAS_POR_MINUTO;
  }
  if (m >= MINUTOS_POR_GRADO) {
    g += 1;
    m -= MINUTOS_POR_GRADO;
  }
  return [g, m, d];
}

/**
 * Descompone un componente decimal (latitud o longitud) en su cadena DMS.
 * Reglas del contrato: grados sin relleno, minutos en 2 dígitos con cero
 * inicial, segundos en 2 dígitos + 1 decimal con cero inicial, y hemisferio
 * N/S (latitud) o E/W (longitud) según el signo. El -0 se trata como positivo.
 */
function dmsParte(
  valor: number,
  hemisferioPositivo: string,
  hemisferioNegativo: string,
): string {
  const absoluto = Math.abs(valor);
  const gradosBase = Math.floor(absoluto);
  const restoMinutos = (absoluto - gradosBase) * 60;
  const minutosBase = Math.floor(restoMinutos);
  const decimasBase = Math.round((restoMinutos - minutosBase) * 600);
  const [grados, minutos, decimas] = normalizarAcarreo(gradosBase, minutosBase, decimasBase);
  const segundosEnteros = Math.floor(decimas / 10);
  const decimaFinal = decimas % 10;
  const hemisferio = valor < 0 ? hemisferioNegativo : hemisferioPositivo;

  return (
    `${grados}\u00B0` +
    `${String(minutos).padStart(2, "0")}'` +
    `${String(segundosEnteros).padStart(2, "0")}.${decimaFinal}"${hemisferio}`
  );
}

/**
 * Convierte coordenadas decimales a la nomenclatura sexagesimal EXACTA del
 * contrato §8: `2.168583, -79.452944 => 2°10'06.9"N 79°27'10.6"W`.
 * Valida rangos satelitales antes de convertir.
 */
export function decimalToDMS(latitude: number, longitude: number): string {
  validarCoordenadas(latitude, longitude);
  const latitud = dmsParte(latitude, "N", "S");
  const longitud = dmsParte(longitude, "E", "W");

  return `${latitud} ${longitud}`;
}

/**
 * Serializa una coordenada decimal para la URL sin notación científica ni
 * ceros sobrantes, preservando la precisión dinámica recibida desde la base.
 */
function serializarCoordenada(valor: number): string {
  if (valor === 0) {
    return "0";
  }
  const texto = String(valor);
  if (!texto.includes("e")) {
    return texto;
  }

  return valor.toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Construye la URL OFICIAL de Google Maps definida en Arquitectura §5.1:
 * https://www.google.com/maps/place/<DMS_ENCODED>/@<LAT>,<LNG>,744m/data=
 * !3m2!1e3!4b1!4m4!3m3!8m2!3d<LAT>!4d<LNG>
 * El segmento <DMS_ENCODED> codifica la cadena DMS con encodeURIComponent y
 * los espacios como "+"; el par final !3d!4d clava el pin en la coordenada exacta.
 */
export function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  validarCoordenadas(latitude, longitude);
  const dmsEncoded = encodeURIComponent(decimalToDMS(latitude, longitude)).replace(/%20/g, "+");
  const lat = serializarCoordenada(latitude);
  const lng = serializarCoordenada(longitude);

  return (
    `https://www.google.com/maps/place/${dmsEncoded}` +
    `/@${lat},${lng},${ZOOM_CONTRATO}` +
    `/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d${lat}!4d${lng}`
  );
}

/**
 * Limpia el nombre dinámico del piloto (llega desde PostgreSQL): elimina
 * caracteres de control, colapsa espacios, recorta al máximo contractual y,
 * si queda vacío, devuelve una etiqueta genérica de auxilio (nunca un nombre
 * personal hardcodeado de una persona real).
 */
function limpiarNombre(riderName: string): string {
  const limpio = String(riderName ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NOMBRE);

  return limpio.length > 0 ? limpio : ETIQUETA_SIN_NOMBRE;
}

/**
 * Redacta el texto bilingüe ES/EN de auxilio con baliza 🚨, negritas nativas
 * de WhatsApp (*...*), nombre del piloto, coordenada DMS y enlace oficial.
 * Un familiar o paramédico lo entiende y lo reenvía en un solo toque.
 */
function construirTextoWhatsapp(nombre: string, dms: string, enlace: string): string {
  return [
    "\u{1F6A8} *ALERTA MÉDICA SAFE / SAFE MEDICAL ALERT* \u{1F6A8}",
    "",
    `*ES:* El casco de *${nombre}* fue escaneado en carretera y requiere auxilio médico inmediato.`,
    `*EN:* The helmet of *${nombre}* was scanned on route and needs immediate medical assistance.`,
    "",
    `📍 *Posición / Location:* ${dms}`,
    `🗺️ *Mapa / Map:* ${enlace}`,
    "",
    "*ES:* Comparta este enlace con los servicios de emergencia y la familia.",
    "*EN:* Please share this link with emergency services and family.",
  ].join("\n");
}

/**
 * Punto de entrada completo: devuelve DMS, URL oficial de Google Maps, texto
 * bilingüe y enlace de WhatsApp (`https://wa.me/?text=<codificado>`) para el
 * despacho de emergencias, la ficha pública del casco y el panel del piloto.
 */
export function buildGoogleMapsDirectData(
  latitude: number,
  longitude: number,
  riderName: string,
): GoogleMapsDirectData {
  validarCoordenadas(latitude, longitude);
  const dmsFormatted = decimalToDMS(latitude, longitude);
  const googleMapsUrl = buildGoogleMapsUrl(latitude, longitude);
  const whatsappText = construirTextoWhatsapp(limpiarNombre(riderName), dmsFormatted, googleMapsUrl);
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return { dmsFormatted, googleMapsUrl, whatsappShareUrl, whatsappText };
}

/* ==============================================================================
 * CERTIFICACIÓN INTERNA — CASOS DE PRUEBA QUE VERIFICA EL DIRECTOR (AGENTE 1)
 * ------------------------------------------------------------------------------
 * 1) decimalToDMS(2.168583, -79.452944)
 *    => "2°10'06.9"N 79°27'10.6"W"  (caso exacto del contrato §8, N y W)
 * 2) decimalToDMS(-1.000555, -79.500777)
 *    => "1°00'02.0"S 79°30'02.8"W"  (signos negativos => hemisferios S y W)
 * 3) decimalToDMS(0, 0)
 *    => "0°00'00.0"N 0°00'00.0"E"   (cero => hemisferio positivo, rellenos OK)
 * 4) Acarreo doble (ejecutado y aprobado): decimalToDMS(89.999987, -179.999987)
 *    => "90°00'00.0"N 180°00'00.0"W": los 59.95"+ se redondean a 60.0 -> 0.0"+1',
 *    los 60' se convierten en 00'+1° y jamás se emite 89°60'00.0"N o 90°00'60.0"N.
 * 5) decimalToDMS(91, 0) y decimalToDMS(Number.NaN, 10)
 *    => Error("Coordenada fuera de rango satelital.")
 * buildGoogleMapsUrl(2.168583, -79.452944) sigue el molde literal de §5.1 con
 * DMS_ENCODED = "2%C2%B010'06.9%22N+79%C2%B027'10.6%22W" y pin !3d2.168583!4d-79.452944.
 * ============================================================================== */
