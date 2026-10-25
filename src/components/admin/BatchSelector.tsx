/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Selector de Lotes Emitidos
 * ARCHIVO: src/components/admin/BatchSelector.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Lista los lotes reales devueltos por GET /api/admin/batches y permite elegir
 * uno para imprimir su plancha QR o grabar las antenas de sus chips. Cada
 * botón muestra cifras veraces de PostgreSQL: total, disponibles y activos.
 *
 * ENTRADAS: lotes, lote seleccionado y callback de selección.
 * SALIDAS: cuadrícula de botones accesibles con estado activo en Ink.
 * DEPENDENCIAS: useLocale, AdminBatchSummary.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero lotes de demostración ni cifras fabricadas.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import type { AdminBatchSummary } from "@/lib/api-client";

export interface BatchSelectorProps {
  /** Lotes reales agregados desde PostgreSQL. */
  batches: AdminBatchSummary[];
  /** Nombre del lote actualmente abierto en el inventario. */
  selectedBatchName: string;
  /** Selecciona un lote para cargar su detalle. */
  onSelect: (batchName: string) => void;
}

/**
 * Selector editorial de lotes: botones rectangulares con borde capilar negro.
 * El lote activo invierte a fondo Ink y texto Paper para máxima legibilidad.
 */
export function BatchSelector({
  batches,
  selectedBatchName,
  onSelect,
}: BatchSelectorProps) {
  const { t } = useLocale();

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif font-bold text-heading-sm text-ink">
          {t.admin.generatedBatchesTitle}{" "}
          <span className="font-sans text-micro text-carbon">
            ({batches.length})
          </span>
        </h2>
        <p className="font-sans text-micro text-carbon">
          {t.admin.batchListHint}
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="p-5 border border-dashed border-mist rounded-[8px] bg-paper text-center">
          <p className="font-sans text-micro text-carbon">
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
                className={`min-h-[44px] px-3 py-2 inline-flex flex-col items-start justify-center border rounded-[4px] font-sans text-micro transition-all ${
                  isSelected
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper text-ink border-mist hover:border-ink"
                }`}
              >
                <span className="font-bold tracking-wide">
                  {batch.batchName}
                </span>
                <span
                  className={`text-[11px] ${
                    isSelected ? "text-paper/80" : "text-carbon"
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
