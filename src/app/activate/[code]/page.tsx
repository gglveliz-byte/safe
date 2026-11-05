/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 2: Activación de Kit (Server Component)
 * ARCHIVO: src/app/activate/[code]/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Punto de entrada Server Component para la activación de un kit de rescate.
 * Consulta en milisegundos la configuración del sistema en Neon PostgreSQL
 * (`getAdminPinDispatchConfig`) y determina con certeza el modo operativo
 * (Asistido vs. Normal) sin hacer consultas cliente lentas ni preguntarle nada
 * al motociclista en la pantalla.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 80 líneas).
 * - Cero datos hardcodeados o mocks de demostración.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Cabecera y comentarios canónicos en Español.
 * ==============================================================================
 */

import React, { Suspense } from "react";
import { getAdminPinDispatchConfig } from "@/services/settings.service";
import { ActivatePageClient } from "./ActivatePageClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ pin?: string; v?: string }>;
}

export default async function ActivatePage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  const code = (resolvedParams?.code ?? "").trim().toUpperCase();
  const rawPin = (resolvedSearch?.pin ?? "").trim();
  const initialPin = rawPin.replace(/\D/g, "").slice(0, 6);

  // Consulta en Neon PostgreSQL: determina si el admin tiene activo el modo asistido
  const config = await getAdminPinDispatchConfig();
  const isAssistedMode = Boolean(config.enabled);

  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center">
          <span
            className="w-6 h-6 rounded-full border-2 border-brand-navy-dark border-t-transparent animate-spin"
            aria-hidden="true"
          />
        </div>
      }
    >
      <ActivatePageClient
        code={code}
        isAssistedMode={isAssistedMode}
        initialPin={initialPin}
      />
    </Suspense>
  );
}
