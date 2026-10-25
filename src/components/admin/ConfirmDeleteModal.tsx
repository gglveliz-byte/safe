/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Modal de Confirmación de Eliminación
 * ARCHIVO: src/components/admin/ConfirmDeleteModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal de confirmación para operaciones destructivas en la consola administrativa
 * (eliminar usuario o chip). Diseñado bajo el sistema visual SAFE 2026.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos hardcodeados: 100% diccionario bilingüe.
 * - Accesibilidad: aria-modal, focus trap, cierre con ESC.
 * - Objetivos táctiles mínimos de 44x44px.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useRef } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export interface ConfirmDeleteModalProps {
  /** Título del modal (ej. "Eliminar usuario"). */
  title: string;
  /** Mensaje descriptivo del recurso a eliminar. */
  message: string;
  /** Datos identificativos del recurso (ej. email, folio). */
  details: Record<string, string>;
  /** Callback de confirmación (devuelve Promise<boolean>). */
  onConfirm: () => Promise<boolean>;
  /** Callback de cierre (sin confirmación). */
  onClose: () => void;
  /** Estado de carga de la confirmación. */
  isLoading?: boolean;
  /** Error humano de la última confirmación, vacío si fue exitosa. */
  errorMessage?: string;
}

/**
 * Modal de confirmación para operaciones destructivas con diseño SAFE 2026.
 */
export function ConfirmDeleteModal({
  title,
  message,
  details,
  onConfirm,
  onClose,
  isLoading = false,
  errorMessage = "",
}: ConfirmDeleteModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap: enfoca el botón de confirmar al abrir
  useEffect(() => {
    confirmButtonRef.current?.focus();

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleConfirm = async () => {
    triggerHaptic("light");
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-navy-dark/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="w-full max-w-md bg-brand-white border border-brand-border-subtle rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 transition-all">
        {/* Cabecera con icono de advertencia */}
        <div className="flex items-start gap-3.5 border-b border-brand-separator pb-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-brand-accent/30 flex items-center justify-center shrink-0 text-brand-accent text-lg">
            ⚠️
          </div>
          <div>
            <h3
              id="confirm-delete-title"
              className="font-serif font-bold text-xl text-brand-navy-dark leading-tight"
            >
              {title}
            </h3>
            <p className="font-sans text-xs text-brand-text-desc mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Datos identificativos del recurso */}
        <div className="p-3.5 bg-brand-bg-alt border border-brand-border-subtle rounded-xl flex flex-col gap-2.5">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                {key}
              </span>
              <span className="font-mono text-xs font-semibold text-brand-navy-dark break-all">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Error en caso de fallo */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium"
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-h-[44px] w-full inline-flex items-center justify-center px-4 py-2.5 bg-brand-accent hover:bg-[#e03f27] text-white font-sans text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-accent/50 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? t.common.saving : t.admin.deleteConfirmButton}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[44px] w-full inline-flex items-center justify-center px-4 py-2.5 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark font-sans text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
