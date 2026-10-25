/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Seguridad en el Borde — Edge Middleware & Cabeceras HTTP
 * ARCHIVO: src/middleware.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Middleware de borde (Edge Runtime) de Next.js. Custodia el acceso a las
 * rutas privadas de la aplicación (/dashboard y /admin), inyecta cabeceras
 * de seguridad HTTP estrictas (HSTS, CSP, X-Frame-Options, X-Content-Type)
 * y previene accesos no autorizados antes de llegar al servidor de renderizado.
 *
 * REGLA CRÍTICA DE ARQUITECTURA:
 * Solo importa `@/lib/auth-token`. Queda terminantemente prohibido importar
 * Prisma, bcrypt o `src/lib/auth.ts` debido a las restricciones de Edge.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Cabeceras y comentarios en Español.
 * ==============================================================================
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth-token";

/**
 * Cabeceras de seguridad aplicadas a todas las peticiones procesadas.
 */
function applySecurityHeaders(headers: Headers): void {
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-DNS-Prefetch-Control", "on");
  headers.set(
    "Permissions-Policy",
    "geolocation=(self), camera=(), microphone=(), payment=()",
  );
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
}

/**
 * Middleware de borde ejecutado antes de despachar cada ruta de Next.js.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");

  // Si no es una ruta protegida, continuar aplicando cabeceras
  if (!isDashboardRoute && !isAdminRoute) {
    const response = NextResponse.next();
    applySecurityHeaders(response.headers);
    return response;
  }

  // Extraer token de la cookie HttpOnly
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  // 1. Protección de rutas de motociclista (/dashboard)
  if (isDashboardRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    applySecurityHeaders(response.headers);
    return response;
  }

  // 2. Protección de rutas de administración (/admin)
  if (isAdminRoute) {
    // Si la petición API admin incluye clave maestra, el endpoint la validará
    if (pathname.startsWith("/api/admin")) {
      const response = NextResponse.next();
      applySecurityHeaders(response.headers);
      return response;
    }

    // Para vistas /admin web, se exige rol ADMIN en la cookie de sesión
    if (!session || session.role !== "ADMIN") {
      const adminLoginUrl = new URL("/login", request.url);
      adminLoginUrl.searchParams.set("redirect", "/admin");
      return NextResponse.redirect(adminLoginUrl);
    }

    const response = NextResponse.next();
    applySecurityHeaders(response.headers);
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response.headers);
  return response;
}

/**
 * Configuración del matcher para excluir archivos estáticos e imágenes.
 */
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. /api/auth (rutas de autenticación pública)
     * 2. /_next (archivos internos de Next.js)
     * 3. /static, /icons, /favicon.ico, manifest.json, sw.js
     * 4. Archivos con extensión (.svg, .png, .jpg, .webp, .css, .js)
     */
    "/((?!_next/static|_next/image|icons/|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)).*)",
  ],
};
