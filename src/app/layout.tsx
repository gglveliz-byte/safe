/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Layout Raíz y Metadatos PWA
 * ARCHIVO: src/app/layout.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Layout raíz de la aplicación web. Incorpora la tipografía editorial broadsheet,
 * metadatos de instalación PWA standalone, viewport adaptable a muescas móviles,
 * registro transparente del Service Worker offline, y contenedor ergonómico.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Fondo de página inalterable en #efefef (Concrete).
 * - Cero texto hardcodeado en la interfaz visible.
 * ==============================================================================
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { IncidentNavbar } from "@/components/ui/IncidentNavbar";
import { IncidentFooter } from "@/components/ui/IncidentFooter";

export const metadata: Metadata = {
  title: "SAFE — Emergency Medical & Real-Time GPS Ledger for Riders",
  description:
    "Ficha médica de emergencia y auxilio satelital en tiempo real para motociclistas. Información clínica vital en 1 segundo.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SAFE",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#efefef",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full bg-concrete">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col bg-concrete text-ink antialiased selection:bg-signal-orange selection:text-paper">
        {/* Barra de Navegación Broadsheet */}
        <IncidentNavbar />

        {/* Contenedor Principal Adaptable */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Pie de Página Institucional */}
        <IncidentFooter />

        {/* Script de Registro del Service Worker Offline */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
