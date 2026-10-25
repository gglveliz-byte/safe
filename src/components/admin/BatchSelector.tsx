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
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark">
          {t.admin.generatedBatchesTitle}{" "}
          <span className="font-sans text-xs font-semibold text-brand-text-muted">
            ({batches.length})
          </span>
        </h2>
        <p className="font-sans text-xs text-brand-text-muted">
          {t.admin.batchListHint}
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="p-6 border border-dashed border-brand-border-subtle rounded-xl bg-brand-white text-center">
          <p className="font-sans text-xs text-brand-text-muted">
            {t.admin.batchListEmpty}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {batches.map((batch) => {
            const isSelected = selectedBatchName === batch.batchName;
            return (
              <button
                key={batch.batchName}
                type="button"
                onClick={() => onSelect(batch.batchName)}
                aria-pressed={isSelected}
                className={`min-h-[48px] px-3.5 py-2 inline-flex flex-col items-start justify-center border rounded-lg font-sans text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-navy-dark text-white border-brand-navy-dark shadow-sm"
                    : "bg-brand-white text-brand-navy-dark border-brand-border-subtle hover:border-brand-border-strong hover:bg-brand-bg-alt"
                }`}
              >
                <span className="font-bold tracking-wide">
                  {batch.batchName}
                </span>
                <span
                  className={`text-[11px] ${
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
