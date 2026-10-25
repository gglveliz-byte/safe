/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Resumen Operativo de la Plataforma
 * ARCHIVO: src/components/admin/AdminMetrics.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Cuatro tarjetas de recuento con cifras 100% reales de PostgreSQL:
 * usuarios registrados, chips vinculados a una cuenta, chips disponibles para
 * distribución y chips activos en rodaje. Reemplaza al antiguo resumen de
 * lote para dar al operador una lectura global antes de entrar a cada sección.
 *
 * ENTRADAS: conteos calculados por la vista padre a partir de /api/admin/riders
 * y /api/admin/batches.
 * SALIDAS: cuadrícula de tarjetas Incident con etiquetas del diccionario.
 * DEPENDENCIAS: useLocale, IncidentCard.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero cifras fabricadas ni valores por defecto inventados.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentCard } from "@/components/ui/IncidentCard";

export interface AdminMetricsProps {
  /** Total de cuentas con rol RIDER registradas. */
  registeredRiders: number;
  /** Cuentas que ya tienen un folio SAFE vinculado. */
  linkedChips: number;
  /** Kits vírgenes disponibles para distribuir. */
  availableChips: number;
  /** Kits activados por un motociclista. */
  activeChips: number;
}

/** Cifra grande en serif + microetiqueta Arial para cada indicador. */
function MetricValue({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <IncidentCard padding="sm" className="text-center">
      <span
        className={`font-serif text-heading-sm sm:text-heading font-bold ${
          accent ? "text-signal-orange" : "text-ink"
        }`}
      >
        {value}
      </span>
      <span className="font-sans text-[11px] uppercase tracking-wider text-carbon block mt-0.5">
        {label}
      </span>
    </IncidentCard>
  );
}

/**
 * Resumen operativo global de la consola administrativa.
 * El único acento cromático es la baliza Signal Orange en los chips disponibles.
 */
export function AdminMetrics({
  registeredRiders,
  linkedChips,
  availableChips,
  activeChips,
}: AdminMetricsProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricValue
        value={registeredRiders}
        label={t.admin.metricsRegistered}
      />
      <MetricValue value={linkedChips} label={t.admin.metricsLinked} />
      <MetricValue
        value={availableChips}
        label={t.admin.metricsAvailable}
        accent
      />
      <MetricValue value={activeChips} label={t.admin.metricsActive} />
    </div>
  );
}
