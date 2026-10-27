/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Modal de Creación de Lote de Chips (SAFE 2026)
 * ARCHIVO: src/components/admin/CreateBatchModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal fijo y elegante para la emisión de nuevos lotes de chips SAFE.
 * Permite ingresar el nombre único del lote y la cantidad de kits a emitir.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos en duro: 100% diccionario bilingüe.
 * - Accesibilidad: aria-modal, focus trap, cierre con ESC.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (batchName: string, quantity: number) => Promise<boolean>;
}

export function CreateBatchModal({
  isOpen,
  onClose,
  onCreate,
}: CreateBatchModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [batchName, setBatchName] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus trap y tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage("");
    const timer = setTimeout(() => inputRef.current?.focus(), 50);

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const name = batchName.trim();
    if (!name || name.length < 3 || name.length > 80) {
      triggerHaptic("error");
      setErrorMessage(t.admin.batchNameError);
      return;
    }

    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 1 || qty > 100) {
      triggerHaptic("error");
      setErrorMessage(t.admin.batchQuantityError);
      return;
    }

    setIsSubmitting(true);
    triggerHaptic("light");

    try {
      const ok = await onCreate(name, qty);
      if (ok) {
        setBatchName("");
        setQuantity("10");
        onClose();
      }
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : t.common.errorGeneric;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-navy-dark/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-batch-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-brand-white border border-brand-border-subtle rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 my-auto transition-all">
        {/* Cabecera del modal */}
        <div className="flex items-start justify-between border-b border-brand-separator pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                {t.admin.consoleLabel}
              </span>
            </div>
            <h3
              id="create-batch-title"
              className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight"
            >
              {t.admin.batchTitle}
            </h3>
            <p className="font-sans text-xs text-brand-text-desc mt-1 leading-relaxed">
              {t.admin.batchSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-brand-text-muted hover:text-brand-navy-dark rounded-md hover:bg-brand-bg-alt transition-colors cursor-pointer"
            aria-label={t.common.cancel}
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="modal-batch-name"
              className="font-sans text-xs font-semibold text-brand-navy-dark"
            >
              {t.admin.batchNameLabel} *
            </label>
            <input
              ref={inputRef}
              id="modal-batch-name"
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder={t.admin.batchNamePlaceholder}
              required
              disabled={isSubmitting}
              autoCapitalize="words"
              autoComplete="off"
              spellCheck={false}
              className="safe-input-focus h-11 px-4 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="modal-batch-qty"
              className="font-sans text-xs font-semibold text-brand-navy-dark"
            >
              {t.admin.quantityLabel} * (1 - 100)
            </label>
            <input
              id="modal-batch-qty"
              type="number"
              min={1}
              max={100}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="off"
              className="safe-input-focus h-11 px-4 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
            />
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium"
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row-reverse gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] flex-1 inline-flex items-center justify-center px-5 py-2.5 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white font-sans text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <span>
                {isSubmitting
                  ? t.admin.generatingBatch
                  : `+ ${t.admin.createBatchButton}`}
              </span>
              {isSubmitting && (
                <svg className="animate-spin ml-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark font-sans text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
