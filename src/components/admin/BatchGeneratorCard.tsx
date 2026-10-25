/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Generador de Lotes y Códigos QR (SAFE 2026)
 * ARCHIVO: src/components/admin/BatchGeneratorCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Formulario de emisión de un lote físico de chips SAFE bajo la estética
 * editorial SAFE 2026. Persiste folios secuenciales y PINs criptográficos en
 * PostgreSQL.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 160 líneas).
 * - Cero textos en duro: 100% diccionario bilingüe.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";

export interface BatchGeneratorCardProps {
  batchName: string;
  quantity: string;
  isGenerating: boolean;
  notice: string;
  deleteNotice?: string;
  errorMessage: string;
  onBatchNameChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function BatchGeneratorCard({
  batchName,
  quantity,
  isGenerating,
  notice,
  deleteNotice = "",
  errorMessage,
  onBatchNameChange,
  onQuantityChange,
  onCreate,
}: BatchGeneratorCardProps) {
  const { t } = useLocale();

  return (
    <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm hover:border-brand-border-strong flex flex-col gap-5 transition-all">
      <div>
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight">
          {t.admin.batchTitle}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-brand-text-desc mt-0.5">
          {t.admin.batchSubtitle}
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
        noValidate
      >
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label
            htmlFor="admin-batch-name"
            className="font-sans text-xs font-semibold text-brand-navy-dark"
          >
            {t.admin.batchNameLabel}
          </label>
          <input
            id="admin-batch-name"
            type="text"
            value={batchName}
            onChange={(event) => onBatchNameChange(event.target.value)}
            required
            placeholder={t.admin.batchNamePlaceholder}
            className="safe-input-focus h-11 px-4 bg-brand-white border border-brand-border-field rounded-md font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="admin-batch-quantity"
            className="font-sans text-xs font-semibold text-brand-navy-dark"
          >
            {t.admin.quantityLabel}
          </label>
          <input
            id="admin-batch-quantity"
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
            required
            placeholder={t.admin.quantityPlaceholder}
            className="safe-input-focus h-11 px-4 bg-brand-white border border-brand-border-field rounded-md font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
          />
        </div>

        <div className="sm:col-span-3 flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isGenerating}
            className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-sm font-semibold rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <span>
              {isGenerating
                ? t.admin.generatingBatch
                : `+ ${t.admin.createBatchButton}`}
            </span>
            {isGenerating && (
              <svg className="animate-spin ml-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {notice && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-sans text-center font-medium"
        >
          ✓ {notice}
        </div>
      )}

      {deleteNotice && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-sans text-center font-medium"
        >
          ✓ {deleteNotice}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium"
        >
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
}
