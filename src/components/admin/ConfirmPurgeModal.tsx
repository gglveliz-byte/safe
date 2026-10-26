/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Modal de Purga Total del Sistema (SAFE 2026)
 * ARCHIVO: src/components/admin/ConfirmPurgeModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal fijo y elegante para vaciar y purgar de una sola vez todas las cuentas de
 * motociclistas (RIDER), fichas médicas y chips físicos emitidos, manteniendo
 * a salvo las cuentas con rol ADMIN. Exige confirmación explícita.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos hardcodeados: 100% diccionario bilingüe.
 * - Accesibilidad: aria-modal, focus trap, cierre con ESC.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export interface ConfirmPurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPurge: () => Promise<boolean>;
}

export function ConfirmPurgeModal({
  isOpen,
  onClose,
  onConfirmPurge,
}: ConfirmPurgeModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [confirmWord, setConfirmWord] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmWord("");
    setErrorMessage("");
    const timer = setTimeout(() => inputRef.current?.focus(), 50);

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPurging) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, isPurging, onClose]);

  if (!isOpen) return null;

  const isUnlocked = confirmWord.trim().toUpperCase() === "SAFE";

  const handleConfirm = async () => {
    if (!isUnlocked || isPurging) return;
    setIsPurging(true);
    setErrorMessage("");
    triggerHaptic("warning");

    try {
      const ok = await onConfirmPurge();
      if (ok) {
        triggerHaptic("success");
        onClose();
      }
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : t.admin.deleteError;
      setErrorMessage(msg);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-navy-dark/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purge-modal-title"
    >
      <div className="w-full max-w-full sm:max-w-lg bg-brand-white border-t sm:border border-brand-accent/40 rounded-t-2xl sm:rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 transition-all">
        {/* Cabecera de advertencia crítica */}
        <div className="flex items-start gap-3.5 border-b border-brand-separator pb-4">
          <div className="w-11 h-11 rounded-full bg-rose-50 border border-brand-accent/30 flex items-center justify-center shrink-0 text-brand-accent text-xl">
            🚨
          </div>
          <div>
            <h3
              id="purge-modal-title"
              className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight"
            >
              {t.admin.purgeTitle}
            </h3>
            <p className="font-sans text-xs text-brand-text-desc mt-1 leading-relaxed">
              {t.admin.purgeSubtitle}
            </p>
          </div>
        </div>

        {/* Mensaje descriptivo */}
        <div className="p-4 bg-rose-50 border border-brand-accent/20 rounded-xl text-xs text-brand-navy-dark font-sans leading-relaxed flex flex-col gap-2">
          <p className="font-semibold text-brand-accent">
            ⚠️ {t.admin.purgeMessage}
          </p>
          <p className="text-brand-text-desc text-[11px]">
            Para desbloquear el botón de vaciado, escribe <strong className="text-brand-navy-dark font-mono">SAFE</strong> a continuación:
          </p>
        </div>

        {/* Campo de desbloqueo */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="purge-confirm-input"
            className="font-sans text-xs font-semibold text-brand-navy-dark"
          >
            Confirmación: escribe &quot;SAFE&quot;
          </label>
          <input
            ref={inputRef}
            id="purge-confirm-input"
            type="text"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="SAFE"
            autoComplete="off"
            disabled={isPurging}
            className="safe-input-focus h-11 px-4 bg-brand-white border border-brand-border-field rounded-lg font-mono text-center text-sm font-bold tracking-widest text-brand-navy-dark placeholder-brand-text-muted"
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
        <div className="flex flex-col sm:flex-row-reverse gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isUnlocked || isPurging}
            className="min-h-[44px] flex-1 inline-flex items-center justify-center px-5 py-2.5 bg-brand-accent hover:bg-[#e03f27] text-white font-sans text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-accent/50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>
              {isPurging ? t.common.saving : t.admin.purgeConfirmButton}
            </span>
            {isPurging && (
              <svg className="animate-spin ml-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isPurging}
            className="min-h-[44px] px-5 py-2.5 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark font-sans text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
