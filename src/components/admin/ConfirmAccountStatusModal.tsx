/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Modal de Activación / Desactivación
 * ARCHIVO: src/components/admin/ConfirmAccountStatusModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal de confirmación para cambiar el estado operativo de una cuenta de usuario
 * (Activar / Desactivar). Permite suspender el acceso de un piloto y deshabilitar
 * su tag SAFE sin destruir sus datos clínicos ni su historial de emergencias.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - 100% bilingüe mediante el hook useLocale().
 * - Accesibilidad completa: aria-modal, focus trap y cierre con tecla Escape.
 * - Estética SAFE 2026: Newsreader en encabezados, Inter en micro-detalles.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useRef } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import type { AdminRiderItem } from "@/lib/api-client";

export interface ConfirmAccountStatusModalProps {
  /** Usuario sobre el que se va a operar. */
  rider: AdminRiderItem;
  /** Estado objetivo: true para activar, false para desactivar. */
  targetActive: boolean;
  /** Callback para confirmar la acción (devuelve true si fue exitosa). */
  onConfirm: () => Promise<boolean>;
  /** Callback para cerrar el modal sin aplicar cambios. */
  onClose: () => void;
  /** Indica si la petición HTTP está en curso. */
  isLoading?: boolean;
  /** Mensaje de error si la petición falló. */
  errorMessage?: string;
}

export function ConfirmAccountStatusModal({
  rider,
  targetActive,
  onConfirm,
  onClose,
  isLoading = false,
  errorMessage = "",
}: ConfirmAccountStatusModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isLoading]);

  const handleConfirm = async () => {
    triggerHaptic("light");
    const ok = await onConfirm();
    if (ok) {
      onClose();
    }
  };

  const title = targetActive
    ? t.admin.activateUserTitle
    : t.admin.deactivateUserTitle;

  const description = targetActive
    ? t.admin.activateUserMessage
    : t.admin.deactivateUserMessage;

  const confirmLabel = targetActive
    ? t.admin.activateConfirmButton
    : t.admin.deactivateConfirmButton;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-brand-navy-dark/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-status-title"
    >
      <div className="w-full max-w-full sm:max-w-md bg-brand-white border-t sm:border border-brand-border-subtle rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 transition-all">
        {/* Cabecera temática: esmeralda para activar, ámbar para desactivar */}
        <div className="flex items-start gap-3.5 border-b border-brand-separator pb-4">
          <div
            className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 text-lg ${
              targetActive
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-amber-50 border-amber-300 text-amber-700"
            }`}
          >
            {targetActive ? "⚡" : "⏸️"}
          </div>
          <div>
            <h3
              id="confirm-status-title"
              className="font-serif font-bold text-lg sm:text-xl text-brand-navy-dark leading-tight"
            >
              {title}
            </h3>
            <p className="font-sans text-xs text-brand-text-desc mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Ficha resumen del usuario objetivo */}
        <div className="p-3 bg-brand-bg-alt border border-brand-border-subtle rounded-xl flex flex-col gap-1.5 text-xs font-sans">
          <div className="flex justify-between items-center py-1 border-b border-brand-border-subtle/50">
            <span className="text-brand-text-muted font-medium">
              {t.admin.columnRider}:
            </span>
            <span className="text-brand-navy-dark font-bold truncate max-w-[200px]">
              {rider.fullName || t.admin.riderUnnamed}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-brand-border-subtle/50">
            <span className="text-brand-text-muted font-medium">
              {t.admin.emailLabel}:
            </span>
            <span className="text-brand-navy-dark font-mono truncate max-w-[200px]">
              {rider.email}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-brand-border-subtle/50">
            <span className="text-brand-text-muted font-medium">
              {t.admin.columnStatus}:
            </span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                rider.isActive
                  ? "bg-emerald-100/70 text-emerald-800"
                  : "bg-amber-100/70 text-amber-900"
              }`}
            >
              {rider.isActive ? t.admin.accountActive : t.admin.accountDisabled} →{" "}
              <strong className="underline">
                {targetActive ? t.admin.accountActive : t.admin.accountDisabled}
              </strong>
            </span>
          </div>

          {rider.device && (
            <div className="flex justify-between items-center py-1">
              <span className="text-brand-text-muted font-medium">
                {t.admin.columnChip}:
              </span>
              <span className="font-mono text-xs font-bold text-brand-navy-dark">
                {rider.device.code}{" "}
                <span className="text-[10px] text-brand-text-muted font-normal">
                  ({targetActive ? "Se activará" : "Quedará inerte"})
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Aviso de error si ocurrió una excepción en el backend */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium"
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Botones de acción accesibles */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[42px] px-4 py-2 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            {t.common.cancel}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`min-h-[42px] px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-1.5 ${
              targetActive
                ? "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-400"
                : "bg-amber-600 hover:bg-amber-700 text-white focus:ring-2 focus:ring-amber-400"
            }`}
          >
            {isLoading ? (
              <span className="animate-spin mr-1">↻</span>
            ) : (
              <span>{targetActive ? "✓" : "⏸"}</span>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

