/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Configuración de la plataforma Next.js
 * ARCHIVO: next.config.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Define la configuración del runtime de Next.js 15 para el backend de SAFE.
 * Declara los paquetes de servidor que no deben ser empaquetados por el
 * compilador (Prisma, Cloudinary, Nodemailer, bcryptjs y QR) y desactiva la
 * telemetría de desarrollo. No contiene secretos ni valores de demostración.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados o demos.
 * - Cabecera y comentarios en Español.
 * ==============================================================================
 */
import type { NextConfig } from "next";

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
    ];
  },
};

export default nextConfig;
