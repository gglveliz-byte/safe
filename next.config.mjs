/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Infraestructura y Configuración Next.js
 * ARCHIVO: next.config.mjs
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Configuración oficial de Next.js 15 para la plataforma SAFE.
 * Habilita modo estricto de React, optimización de imágenes remotas para
 * Cloudinary y cabeceras de soporte PWA.
 * ==============================================================================
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
