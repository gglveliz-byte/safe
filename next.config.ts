/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Configuración de la plataforma Next.js (ÚNICA config activa)
 * ARCHIVO: next.config.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Define la configuración del runtime de Next.js 15 para el backend de SAFE.
 * CONSOLIDACIÓN C-18/A-05 (CRITICAL): existían dos configuraciones simultáneas
 * (next.config.mjs con images.remotePatterns y next.config.ts con
 * serverExternalPackages + headers) y Next 15 priorizaba la .mjs, dejando la
 * .ts MUERTA. Se fusionó todo aquí y next.config.mjs fue ELIMINADO: este es el
 * ÚNICO archivo de configuración activo del proyecto.
 *
 * Contenido:
 * 1. serverExternalPackages: paquetes nativos de Node no empaquetados (Prisma,
 *    Cloudinary, Nodemailer, bcryptjs y QR).
 * 2. images.remotePatterns: optimización de fotografías remotas de Cloudinary
 *    (migrado desde la .mjs eliminada).
 * 3. headers(): cabeceras de seguridad — Cache-Control no-store para la API y
 *    Content-Security-Policy global (A-05: el middleware la mencionaba pero no
 *    la aplicaba). X-Content-Type-Options, Referrer-Policy, X-Frame-Options,
 *    Permissions-Policy y HSTS ya los inyecta src/middleware.ts
 *    (applySecurityHeaders) y NO se duplican aquí.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados de demo ni secretos.
 * - Cabecera y comentarios en Español.
 * ==============================================================================
 */
import type { NextConfig } from "next";

/**
 * Content-Security-Policy básica para una plataforma médica (corrección A-05).
 * Ajustada a los dominios reales que consume el proyecto:
 * - script-src 'unsafe-inline'/'unsafe-eval': exigidos por el runtime de Next.js
 *   (datos de hidratación en línea y webpack en desarrollo).
 * - img-src: fotografías de rostro en res.cloudinary.com y previsualizaciones
 *   locales en data URI (selector de foto del piloto).
 * - connect-src: mismo origen (todo el frontend consume /api/* propio) más
 *   Neon y Cloudinary como contingencia de cliente.
 * - frame-ancestors 'none': anti-clickjacking (equivalente al X-Frame-Options
 *   DENY que ya aplica el middleware de borde).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://res.cloudinary.com https://*.googleapis.com https://*.googleusercontent.com",
  "connect-src 'self' ws: wss: https://*.neon.tech https://api.cloudinary.com",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Estos paquetes usan APIs nativas de Node y deben ejecutarse en el servidor.
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "cloudinary",
    "nodemailer",
    "qrcode",
  ],
  // Optimización de imágenes remotas (Cloudinary y Google User Content para fotografía del casco)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  eslint: {
    // La certificación del backend se realiza con `tsc --noEmit`.
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        // Los endpoints de emergencia nunca deben almacenarse en caché.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // A-05: CSP global para todas las rutas (páginas y estáticos).
        // Complementa las cabeceras del middleware de borde sin duplicarlas
        // (nosniff/Referrer-Policy/HSTS/X-Frame-Options viven en middleware.ts).
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
        ],
      },
    ];
  },
};

export default nextConfig;
