/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Vista de Éxito / Confirmación de Activación
 * ARCHIVO: src/app/activate/[code]/ActivateSuccessSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pantalla de confirmación tras activar exitosamente un kit virgen:
 * muestra el folio único protegido, el escudo institucional con la paleta Incident,
 * mensaje tranquilizador y botón de acceso directo al Dashboard del motociclista.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos hardcodeados: 100% diccionario vía useLocale().
 * - Táctiles ≥44px y diseño BroadSheet Incident 2026.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";

export interface ActivateSuccessSectionProps {
  deviceCode: string;
  redirect: string;
  onNavigate: (url: string) => void;
}

export function ActivateSuccessSection({
  deviceCode,
  redirect,
  onNavigate,
}: ActivateSuccessSectionProps) {
  const { t } = useLocale();

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col items-center justify-center text-center animate-fadeInUp">
      <div className="w-full bg-brand-white border border-brand-border-subtle rounded-2xl p-7 sm:p-9 shadow-lg flex flex-col items-center gap-5">
        <div
          aria-hidden="true"
          className="w-16 h-16 rounded-2xl bg-brand-nav-active border border-brand-border-subtle flex items-center justify-center text-3xl shadow-xs"
        >
          🛡️
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy-dark leading-tight">
          {t.activate.successTitle}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-brand-text-desc leading-relaxed">
          {t.activate.successMessage}
        </p>
        <div className="flex flex-col items-center gap-1.5 p-3.5 bg-brand-bg-alt border border-brand-border-subtle rounded-xl w-full">
          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
            {t.dashboard.folioLabel}
          </span>
          <span className="font-mono text-base font-bold uppercase tracking-widest text-brand-navy-dark">
            {deviceCode}
          </span>
        </div>
        <button
          type="button"
          className="w-full min-h-[48px] inline-flex items-center justify-center px-6 py-3.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer mt-2"
          onClick={() => onNavigate(redirect)}
        >
          {t.activate.goToDashboard}
        </button>
      </div>
    </div>
  );
}
