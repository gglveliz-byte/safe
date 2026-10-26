/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Resumen Operativo Compacto (SAFE 2026)
 * ARCHIVO: src/components/admin/AdminMetrics.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * 4 métricas operativas compactas con cifras 100% reales de PostgreSQL:
 * usuarios registrados, chips vinculados, kits disponibles y chips activos.
 * Diseñado en formato ultra-compacto sin espacios vacíos desperdiciados.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 80 líneas).
 * - Cero cifras fabricadas ni valores inventados.
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

export function AdminMetrics({
  registeredRiders,
  linkedChips,
  availableChips,
  activeChips,
}: AdminMetricsProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 w-full">
      <div className="bg-brand-white border border-brand-border-subtle rounded-lg px-3 py-1.5 flex items-center justify-between gap-1.5 shadow-xs hover:border-brand-border-strong transition-all">
        <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-text-muted font-bold truncate">
          {t.admin.metricsRegistered}
        </span>
        <span className="font-serif text-base sm:text-lg font-bold text-brand-navy-dark shrink-0">
          {registeredRiders}
        </span>
      </div>

      <div className="bg-brand-white border border-brand-border-subtle rounded-lg px-3 py-1.5 flex items-center justify-between gap-1.5 shadow-xs hover:border-brand-border-strong transition-all">
        <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-text-muted font-bold truncate">
          {t.admin.metricsLinked}
        </span>
        <span className="font-serif text-base sm:text-lg font-bold text-brand-navy-dark shrink-0">
          {linkedChips}
        </span>
      </div>

      <div className="bg-brand-white border border-brand-border-subtle rounded-lg px-3 py-1.5 flex items-center justify-between gap-1.5 shadow-xs hover:border-brand-border-strong transition-all">
        <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-text-muted font-bold truncate">
          {t.admin.metricsAvailable}
        </span>
        <span className="font-serif text-base sm:text-lg font-bold text-brand-accent shrink-0">
          {availableChips}
        </span>
      </div>

      <div className="bg-brand-white border border-brand-border-subtle rounded-lg px-3 py-1.5 flex items-center justify-between gap-1.5 shadow-xs hover:border-brand-border-strong transition-all">
        <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-brand-text-muted font-bold truncate">
          {t.admin.metricsActive}
        </span>
        <span className="font-serif text-base sm:text-lg font-bold text-brand-navy-dark shrink-0">
          {activeChips}
        </span>
      </div>
    </div>
  );
}
