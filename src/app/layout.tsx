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
import { PublicChrome } from "@/components/layout/PublicChrome";

export const metadata: Metadata = {
  title: "SAFE — Emergency Medical & Real-Time GPS Ledger for Riders",
  description:
    "Ficha médica de emergencia y auxilio satelital en tiempo real para motociclistas. Información clínica vital en 1 segundo.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
    <html lang="es" className="h-full bg-concrete" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-concrete text-ink antialiased selection:bg-signal-orange selection:text-paper"
        suppressHydrationWarning
      >
        {/* Cromo institucional: público con navbar/footer; /admin solo contenido */}
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}
