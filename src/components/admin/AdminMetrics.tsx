/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Resumen Operativo de la Plataforma (SAFE 2026)
 * ARCHIVO: src/components/admin/AdminMetrics.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Cuatro tarjetas de recuento con cifras 100% reales de PostgreSQL:
 * usuarios registrados, chips vinculados a una cuenta, chips disponibles para
 * distribución y chips activos en rodaje con el diseño editorial SAFE 2026.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 90 líneas).
 * - Cero cifras fabricadas ni valores por defecto inventados.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";

export interface AdminMetricsProps {
  registeredRiders: number;
  linkedChips: number;
  availableChips: number;
  activeChips: number;
}

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
    <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-4 sm:p-5 text-center shadow-sm hover:border-brand-border-strong hover:shadow transition-all duration-200">
      <span
        className={`font-serif text-2xl sm:text-3xl font-bold block ${
          accent ? "text-brand-accent" : "text-brand-navy-dark"
        }`}
      >
        {value}
      </span>
      <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-text-muted font-semibold block mt-1">
        {label}
      </span>
    </div>
  );
}

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
