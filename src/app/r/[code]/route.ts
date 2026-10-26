/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Gateway Público del Casco — Enrutador Inteligente por Estado del Kit
 * ARCHIVO: src/app/r/[code]/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Route handler GET del gateway público `/r/[code]` que todo lector NFC/QR o
 * enlace directo consulta cuando se escanea un casco de SAFE. Su responsabilidad
 * es bifurcar el flujo según el estado del dispositivo en PostgreSQL:
 *
 *   - UNCLAIMED o ACTIVE sin cuenta → redirige a `/activate/[code]`
 *     (alta inicial o re-activación de un chip liberado por borrado de cuenta).
 *   - ACTIVE con cuenta → redirige a `/emergency/[code]` (ficha médica de emergencia).
 *   - DISABLED   → responde 404 HTML bilingüe (diseño Incident, contrato §9/§11).
 *   - No existe  → responde 404 HTML bilingüe (diseño Incident, contrato §9/§11).
 *
 * El querystring opcional `?v=nfc|qr|direct` se propaga tal cual a la vista de
 * emergencia para que la UI muestre el indicador visual de la fuente de escaneo.
 *
 * ENTRADAS: `params.code` (folio del casco), `searchParams.v` (fuente de escaneo).
 * SALIDAS: NextResponse redirect 307, 404 HTML bilingüe (chip inactivo) o
 *          errorResponse canónico (validación 400 / rate limit 429 / 500).
 * DEPENDENCIAS: @/lib/db, @/lib/api-response, @/lib/request,
 *               @/lib/schemas/common.schema, @/lib/schemas/emergency.schema,
 *               @/services/throttle.service, ./not-found-html, next/server.
 *
 * ANTI-ABUSO:
 * - Rate limit de gateway por IP (GATEWAY_IP_POLICY: 60 peticiones/min,
 *   bloqueo 5 min) con consumo de cuota ANTES de tocar la base de datos;
 *   el 404 por chip inactivo no añade ningún consumo adicional.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Cabecera y comentarios en Español.
 * - Cache-Control: no-store en TODAS las respuestas (contrato §2).
 * ==============================================================================
 */

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import {
  handleApiError,
  parseQuery,
} from "@/lib/api-response";
import { getClientIp } from "@/lib/request";
import { DeviceCodeParamSchema } from "@/lib/schemas/common.schema";
import { EmergencyScanQuerySchema } from "@/lib/schemas/emergency.schema";
import {
  consumeThrottle,
  GATEWAY_IP_POLICY,
} from "@/services/throttle.service";

import { buildChipInactiveHtml } from "./not-found-html";

/**
 * Runtime canónico del handler: Node.js (acceso a Prisma, SMTP y PostgreSQL).
 * No se usa Edge porque el gateway requiere conexión a la base de datos.
 */
export const runtime = "nodejs";

/**
 * Modo de renderizado: force-dynamic para que Next.js jamás cachee esta ruta
 * en el borde ni la sirva desde un ISR stale. Cada escaneo debe leer el
 * estado actual del casco en PostgreSQL.
 */
export const dynamic = "force-dynamic";

/**
 * Respuesta 404 HTML bilingüe del chip inactivo (hallazgo H-03, contrato
 * §9/§11): documento autónomo con el diseño 'Incident' servido como
 * text/html sin almacenaje (Cache-Control: no-store). Sustituye al antiguo
 * JSON de error para que el transeúnte que escanea un casco inexistente o
 * dado de baja vea un aviso humano en español e inglés, no una traza técnica.
 *
 * @returns NextResponse 404 con el cuerpo HTML de buildChipInactiveHtml().
 */
function chipInactiveHtmlResponse(): NextResponse {
  return new NextResponse(buildChipInactiveHtml(), {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * GET /r/[code] — Gateway inteligente del casco.
 *
 * Bifurcación según el estado del Device en PostgreSQL:
 *   - Si el casco no existe o su status es "DISABLED" → 404 HTML bilingüe.
 *   - Si el casco está "UNCLAIMED" o "ACTIVE" sin cuenta vinculada (chip
 *     liberado por borrado de cuenta, hallazgo H-04) → redirect 307 a
 *     `/activate/[code]` para completar o re-completar el alta.
 *   - Si el casco está "ACTIVE" con cuenta → redirect 307 a `/emergency/[code]`
 *     que muestra la ficha médica pública al paramédico o testigo.
 *
 * El parámetro `v` del querystring (nfc/qr/direct) se propaga a la vista de
 * emergencia para que la UI muestre el indicador visual de la fuente de escaneo.
 *
 * @param request Petición HTTP entrante (se usa `request.url` para construir
 *                la URL absoluta del redirect y la IP para el rate limit).
 * @param params  Parámetros de ruta dinámicos de Next.js App Router.
 *                `code` es el folio del casco escaneado.
 * @returns NextResponse con redirect 307, 404 HTML bilingüe o error canónico.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  try {
    // ─────────────────────────────────────────────────────────────────
    // 0. RATE LIMIT DE GATEWAY POR IP (hallazgos H-13 + A-02#24)
    //    Consume una unidad de cuota (GATEWAY_IP_POLICY: 60 peticiones/min,
    //    bloqueo 5 min) ANTES de cualquier consulta a la base de datos, para
    //    frenar el barrido masivo de folios. La cuota es amplia: el
    //    rescatista legítimo jamás la agota y el 404 por chip inactivo no
    //    añade consumo extra. Si se supera, consumeThrottle lanza AppError
    //    RATE_LIMIT y handleApiError responde el 429 canónico.
    // ─────────────────────────────────────────────────────────────────
    await consumeThrottle("gateway-ip", getClientIp(request), GATEWAY_IP_POLICY);

    // ─────────────────────────────────────────────────────────────────
    // 1. VALIDACIÓN DEL PARÁMETRO DE RUTA (folio del casco)
    //    DeviceCodeParamSchema normaliza a mayúsculas y recorta espacios
    //    para que "safe-0001" y "SAFE-0001" lleguen idénticos a la BD.
    // ─────────────────────────────────────────────────────────────────
    const { code } = await params;
    const validatedCode = DeviceCodeParamSchema.parse(code);

    // ─────────────────────────────────────────────────────────────────
    // 2. VALIDACIÓN DEL QUERYSTRING (?v=nfc|qr|direct)
    //    EmergencyScanQuerySchema recorta (strip) las claves desconocidas
    //    inyectadas por un cliente manipulado y valida `v` contra el
    //    catálogo nfc|qr|direct; un valor inválido sí se rechaza con 400.
    // ─────────────────────────────────────────────────────────────────
    const { v, pin } = await parseQuery(request.url, EmergencyScanQuerySchema);

    // ─────────────────────────────────────────────────────────────────
    // 3. CONSULTA DEL ESTADO DEL CASCO EN POSTGRESQL
    //    Solo se traen los campos mínimos necesarios (code, status, userId)
    //    para tomar la decisión de bifurcación. userId permite detectar el
    //    chip "zombi" (ACTIVE sin cuenta tras un borrado, hallazgo H-04).
    //    No se expone información sensible del rider en este endpoint.
    // ─────────────────────────────────────────────────────────────────
    const device = await db.device.findUnique({
      where: { code: validatedCode },
      select: { code: true, status: true, userId: true },
    });

    // ─────────────────────────────────────────────────────────────────
    // 4. CASCO INEXISTENTE O DESACTIVADO → 404 HTML BILINGÜE (hallazgo H-03)
    //    Un casco DISABLED (pérdida, robo o reemplazo) debe mostrarse
    //    como inerte para evitar que un tercero lo reactive. El contrato
    //    §9/§11 exige una página HTML humana en español e inglés con el
    //    diseño Incident, no un JSON técnico incomprensible en la vía.
    // ─────────────────────────────────────────────────────────────────
    if (!device || device.status === "DISABLED") {
      return chipInactiveHtmlResponse();
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. CASCO VIRGEN (UNCLAIMED) O SIN CUENTA (hallazgo H-04) → ACTIVACIÓN
    //    El motociclista acaba de recibir su kit y debe completarlo:
    //    validar PIN, crear cuenta, registrar perfil médico y contactos.
    //    Si el QR traía el PIN de seguridad, se propaga para auto-asignarlo.
    //    Se usa 307 (Temporary Redirect) para que el navegador conserve
    //    el método GET en el salto.
    // ─────────────────────────────────────────────────────────────────
    if (device.status === "UNCLAIMED" || !device.userId) {
      const activateUrl = new URL(`/activate/${validatedCode}`, request.url);
      if (pin) {
        activateUrl.searchParams.set("pin", pin);
      }
      return NextResponse.redirect(activateUrl, 307);
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. CASCO ACTIVADO (ACTIVE) CON CUENTA → REDIRECT A FICHA DE EMERGENCIA
    //    El paramédico o testigo ve la ficha médica pública del rider
    //    con el enlace a Google Maps y los contactos de auxilio.
    //    El querystring `v` se propaga para el indicador visual de la
    //    fuente de escaneo (NFC/QR/direct).
    // ─────────────────────────────────────────────────────────────────
    if (device.status === "ACTIVE") {
      const emergencyPath = `/emergency/${validatedCode}${v ? `?v=${v}` : ""}`;
      const emergencyUrl = new URL(emergencyPath, request.url);
      return NextResponse.redirect(emergencyUrl, 307);
    }

    // ─────────────────────────────────────────────────────────────────
    // 7. ESTADO NO RECONOCIDO (defensivo)
    //    Si el enum DeviceStatus crece en el futuro y se añade un nuevo
    //    estado no contemplado aquí, se responde el mismo 404 HTML
    //    bilingüe en lugar de dejar que el handler termine sin respuesta.
    // ─────────────────────────────────────────────────────────────────
    return chipInactiveHtmlResponse();
  } catch (error) {
    // ─────────────────────────────────────────────────────────────────
    // 8. MANEJO UNIFICADO DE ERRORES
    //    handleApiError traduce AppError (incluido el RATE_LIMIT 429 que
    //    lanza consumeThrottle), ZodError, Prisma y errores genéricos a
    //    respuestas canónicas { success: false } con el estado HTTP
    //    semántico correspondiente. Nunca filtra trazas.
    // ─────────────────────────────────────────────────────────────────
    return handleApiError(error, "GET /r/[code] — gateway-casco");
  }
}
