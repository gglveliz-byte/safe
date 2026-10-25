/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Utilidades HTTP — Contexto de Petición (IP y User-Agent)
 * ARCHIVO: src/lib/request.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Extrae de forma segura el contexto de red del cliente que invoca cualquier
 * route handler de SAFE: dirección IP real (resolviendo cadenas de proxy
 * inverso: Nginx, Cloudflare y Vercel) y cadena User-Agent. Se consume para
 * ventanas de cooldown anti-spam, protección de fuerza bruta sobre PINs de
 * activación, registro de auditoría de escaneos de casco y consentimiento.
 *
 * PRIVACIDAD (PII): la IP obtenida aquí SOLO se persiste en base de datos
 * hasheada con HMAC (ver src/lib/crypto.ts / hmacSha256). Nunca se guarda ni
 * se expone la dirección IP cruda del motociclista o del transeúnte que
 * escanea el casco, conforme al marco de Privacidad y Habeas Data de SAFE.
 *
 * CONTRATOS: docs/BACKEND_CONTRACTS.md §6 (src/lib/request.ts).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Cabecera y comentarios en Español.
 * ==============================================================================
 */

/**
 * Contexto mínimo de red que acompaña a cada petición auditada del backend.
 * `ip` puede valer "unknown" si ninguna cabecera de proxy está presente.
 */
export interface RequestContext {
  ip: string;
  userAgent: string;
}

/**
 * Lee una cabecera opcional de la petición y devuelve su valor recortado,
 * o null cuando la cabecera falta o viene en blanco.
 * @param request Petición estándar de Runtime.
 * @param name Nombre de la cabecera HTTP (case-insensitive por especificación).
 * @returns Valor recortado o null.
 */
function readHeader(request: Request, name: string): string | null {
  const raw = request.headers.get(name);
  if (raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Obtiene la dirección IP real del cliente evaluando, en orden de confianza,
 * las cabeceras de proxy inverso estándar:
 * 1. x-forwarded-for  → primera entrada de la lista (IP original del cliente).
 * 2. x-real-ip        → inyectada por Nginx / balanceadores.
 * 3. cf-connecting-ip → inyectada por Cloudflare.
 * 4. x-vercel-forwarded-for → inyectada por la plataforma Vercel.
 * Si ninguna existe se devuelve "unknown" (nunca se inventa una IP).
 * @param request Petición estándar de Runtime.
 * @returns IP del cliente o la cadena literal "unknown".
 */
export function getClientIp(request: Request): string {
  const forwardedFor = readHeader(request, "x-forwarded-for");
  if (forwardedFor !== null) {
    const firstEntry = forwardedFor.split(",")[0]?.trim();
    if (firstEntry && firstEntry.length > 0) {
      return firstEntry;
    }
  }

  const realIp = readHeader(request, "x-real-ip");
  if (realIp !== null) {
    return realIp;
  }

  const cloudflareIp = readHeader(request, "cf-connecting-ip");
  if (cloudflareIp !== null) {
    return cloudflareIp;
  }

  const vercelIp = readHeader(request, "x-vercel-forwarded-for");
  if (vercelIp !== null) {
    const firstVercel = vercelIp.split(",")[0]?.trim();
    if (firstVercel && firstVercel.length > 0) {
      return firstVercel;
    }
  }

  return "unknown";
}

/**
 * Obtiene la cadena User-Agent del cliente, con "unknown" como respaldo.
 * @param request Petición estándar de Runtime.
 * @returns User-Agent recortado o "unknown".
 */
export function getUserAgent(request: Request): string {
  return readHeader(request, "user-agent") ?? "unknown";
}

/**
 * Construye el objeto completo de contexto de petición consumido por los
 * servicios de activación, alerta de emergencia y consentimiento legal.
 * @param request Petición estándar de Runtime.
 * @returns RequestContext con ip (solo se persistirá hasheada) y userAgent.
 */
export function getRequestContext(request: Request): RequestContext {
  return {
    ip: getClientIp(request),
    userAgent: getUserAgent(request),
  };
}
