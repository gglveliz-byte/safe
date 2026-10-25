/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Dashboard — Skeleton de Carga del Panel del Motociclista
 * ARCHIVO: src/components/dashboard/DashboardSkeleton.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Vista transitoria mostrada mientras se consulta el expediente médico protegido
 * al backend real (GET /api/profile). Extraída de src/app/dashboard/page.tsx por
 * la partición obligatoria C-19 (zona crítica 451-500 líneas).
 *
 * CORRECCIÓN C-10 (CRITICAL): se erradicaron los textos hardcodeados
 * ("Cargando expediente...", "Verificando identidad...", "Conectando con el
 * registro clínico protegido...") y el ternario absurdo `t.common.saving ? ...`.
 * Ahora solo se usan claves reales del diccionario tipado (t.dashboard.title y
 * t.dashboard.welcomeBack) junto al indicador pulsante signal-orange, replicando
 * el encabezado final para evitar saltos visuales al terminar la carga.
 *
 * ENTRADAS: Ninguna (autogestiona el idioma con useLocale).
 * SALIDAS: Tarjeta broadsheet de carga con paleta Incident (concrete/ink/naranja).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero texto hardcodeado: 100% diccionario `t` vía useLocale.
 * - Cabecera y comentarios en español.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentCard } from "@/components/ui/IncidentCard";

/**
 * Skeleton de carga del panel del motociclista.
 * Muestra el indicador pulsante y los textos del diccionario mientras
 * el orquestador (dashboard/page.tsx) consulta el expediente real.
 */
export function DashboardSkeleton() {
  const { t } = useLocale();

  return (
    <div className="safe-mobile-container py-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <IncidentCard
        padding="lg"
        className="w-full max-w-md text-center flex flex-col items-center gap-3"
      >
        {/* Indicador pulsante de actividad (sin texto fabricado) */}
        <span
          className="w-4 h-4 rounded-full bg-signal-orange animate-ping"
          aria-hidden="true"
        />
        <h2 className="font-serif text-xl font-bold text-ink">
          {t.dashboard.title}
        </h2>
        {/* Anuncio accesible del estado de carga con clave real del diccionario */}
        <p
          className="font-sans text-micro text-carbon"
          role="status"
          aria-live="polite"
        >
          {t.dashboard.welcomeBack}
        </p>
      </IncidentCard>
    </div>
  );
}
