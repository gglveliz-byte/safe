/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Resumen Métrico de Producción
 * ARCHIVO: src/components/admin/ProductionSummary.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Tres tarjetas de recuento del lote seleccionado (total de kits emitidos,
 * vírgenes pendientes de grabado y activados por motociclistas). Los números
 * son SIEMPRE datos reales calculados por la vista padre desde PostgreSQL
 * (cero cifras fabricadas, Ley 2); las etiquetas provienen del diccionario
 * bilingüe. Extraído de src/app/admin/page.tsx por la partición obligatoria
 * de la zona crítica de líneas (451-500).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados o demos.
 * - Diseño Incident: papel blanco sobre concreto, baliza signal-orange solo
 *   como acento del recuento de kits vírgenes.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentCard } from "@/components/ui/IncidentCard";

/** Props del resumen: recuentos reales del lote seleccionado. */
export interface ProductionSummaryProps {
  /** Total de kits del lote. */
  totalCount: number;
  /** Kits vírgenes (UNCLAIMED) pendientes de grabado/activación. */
  unclaimedCount: number;
  /** Kits activados (ACTIVE) por motociclistas. */
  activeCount: number;
}

/**
 * Resumen métrico de producción en tres tarjetas paper con hairline.
 * Etiquetas 100% del diccionario (t.admin.*), cifras 100% dinámicas.
 */
export function ProductionSummary({
  totalCount,
  unclaimedCount,
  activeCount,
}: ProductionSummaryProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Total de kits emitidos en el lote */}
      <IncidentCard padding="sm" className="text-center">
        <span className="font-serif text-heading-sm sm:text-heading font-bold text-ink">
          {totalCount}
        </span>
        <span className="font-sans text-[11px] uppercase tracking-wider text-carbon block mt-0.5">
          {t.admin.totalKitsLabel}
        </span>
      </IncidentCard>

      {/* Kits vírgenes: único acento cromático (baliza signal-orange) */}
      <IncidentCard padding="sm" className="text-center">
        <span className="font-serif text-heading-sm sm:text-heading font-bold text-signal-orange">
          {unclaimedCount}
        </span>
        <span className="font-sans text-[11px] uppercase tracking-wider text-carbon block mt-0.5">
          {t.admin.unclaimedLabel}
        </span>
      </IncidentCard>

      {/* Kits activados por motociclistas reales */}
      <IncidentCard padding="sm" className="text-center">
        <span className="font-serif text-heading-sm sm:text-heading font-bold text-ink">
          {activeCount}
        </span>
        <span className="font-sans text-[11px] uppercase tracking-wider text-carbon block mt-0.5">
          {t.admin.activeLabel}
        </span>
      </IncidentCard>
    </div>
  );
}
