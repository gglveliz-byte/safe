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
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import { PublicChrome } from "@/components/layout/PublicChrome";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAFE | Respaldo Médico en Carretera",
  description:
    "Un boletín médico vital en tu casco que habla por ti cuando más lo necesitas. Ficha clínica de rescate y auxilio satelital en 1 segundo.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SAFE",
  },
  icons: {
    icon: "/branding/safe-logo-dark.jpg",
    apple: "/branding/safe-logo-dark.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`h-full scroll-smooth ${newsreader.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-brand-white text-brand-navy-dark font-sans antialiased selection:bg-brand-nav-active selection:text-brand-navy-dark"
        suppressHydrationWarning
      >
        {/* Cromo institucional: público con navbar/footer; /admin y /dashboard solo contenido */}
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}

