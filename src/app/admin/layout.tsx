/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Layout Privado — Consola de Administración
 * ARCHIVO: src/app/admin/layout.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Layout exclusivo de /admin. Aísla la consola del cromo público (navbar con
 * enlaces de motociclistas, políticas y pie legal) y monta la barra operativa
 * compartida de las áreas cerradas (ConsoleTopBar) con idioma y logout.
 *
 * ENTRADAS: children de la vista administrativa.
 * SALIDAS: contenedor de altura completa con barra privada + main.
 * DEPENDENCIAS: ConsoleTopBar.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * ==============================================================================
 */

import React from "react";
import { ConsoleTopBar } from "@/components/layout/ConsoleTopBar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-concrete">
      <ConsoleTopBar area="admin" />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
