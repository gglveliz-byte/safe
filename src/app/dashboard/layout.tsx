/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Layout Privado — Panel del Motociclista
 * ARCHIVO: src/app/dashboard/layout.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Layout exclusivo de /dashboard. El panel del conductor es un área cerrada con
 * sesión iniciada, así que no debe exhibir la navegación pública ("Inicio",
 * "Ingreso Piloto", "Activar mi Casco") ni el pie con términos y privacidad:
 * usa la misma barra privada de la consola (ConsoleTopBar) con su rótulo.
 *
 * ENTRADAS: children de la vista del conductor.
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

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-concrete">
      <ConsoleTopBar area="rider" />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
