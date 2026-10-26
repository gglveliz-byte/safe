/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Selector de Lotes Emitidos (SAFE 2026)
 * ARCHIVO: src/components/admin/BatchSelector.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Lista los lotes reales devueltos por GET /api/admin/batches y permite elegir
 * uno para imprimir su plancha QR o grabar las antenas de sus chips bajo el
 * diseño SAFE 2026.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 110 líneas).
 * - Cero lotes de demostración ni cifras fabricadas.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import type { AdminBatchSummary } from "@/lib/api-client";

export interface BatchSelectorProps {
  batches: AdminBatchSummary[];
  selectedBatchName: string;
  onSelect: (batchName: string) => void;
}

export function BatchSelector({
  batches,
  selectedBatchName,
  onSelect,
}: BatchSelectorProps) {
  const { t } = useLocale();

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-separator/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-base sm:text-lg text-brand-navy-dark">
            {t.admin.generatedBatchesTitle}
          </span>
          <span className="font-sans text-[11px] font-bold text-brand-navy-secondary bg-brand-bg-alt border border-brand-border-subtle px-2 py-0.5 rounded-full">
            {batches.length}
          </span>
        </div>
        <p className="font-sans text-xs text-brand-text-muted">
          {t.admin.batchListHint}
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="p-4 border border-dashed border-brand-border-subtle rounded-xl bg-brand-white text-center">
          <p className="font-sans text-xs text-brand-text-muted">
            {t.admin.batchListEmpty}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {batches.map((batch) => {
            const isSelected = selectedBatchName === batch.batchName;
            return (
              <button
                key={batch.batchName}
                type="button"
                onClick={() => onSelect(batch.batchName)}
                aria-pressed={isSelected}
                className={`min-h-[42px] px-3 py-1.5 inline-flex flex-col items-start justify-center border rounded-lg font-sans text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-navy-dark text-white border-brand-navy-dark shadow-sm"
                    : "bg-brand-white text-brand-navy-dark border-brand-border-subtle hover:border-brand-border-strong hover:bg-brand-bg-alt"
                }`}
              >
                <span className="font-bold tracking-wide">
                  {batch.batchName}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] ${
                    isSelected ? "text-white/80" : "text-brand-text-muted"
                  }`}
                >
                  {batch.totalDevices} {t.admin.totalKitsLabel} ·{" "}
                  {batch.unclaimedDevices} {t.admin.unclaimedLabel} ·{" "}
                  {batch.activeDevices} {t.admin.activeLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
