/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Sección 5: Notas de Rescate y Datos de Ubicación
 * ARCHIVO: src/app/activate/[code]/ActivateRescueNotesSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Recopila observaciones vitales para paramédicos en siniestros:
 * tutor a cargo, notas de rescate, lugar frecuente de rodaje y datos vehiculares
 * (placa / chasis / modelo de motocicleta o bicicleta).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 200 líneas).
 * - Cero textos hardcodeados: 100% diccionario vía useLocale().
 * - Táctiles ≥44px y diseño BroadSheet Incident 2026.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";

export interface ActivateRescueNotesSectionProps {
  hasGuardian: boolean;
  onHasGuardianChange: (val: boolean) => void;
  rescueNotes: string;
  onRescueNotesChange: (val: string) => void;
  frequentLocation: string;
  onFrequentLocationChange: (val: string) => void;
  vehicleInfo: string;
  onVehicleInfoChange: (val: string) => void;
  disabled?: boolean;
}

const INPUT_CLASS =
  "safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted";
const LABEL_CLASS = "font-sans text-xs font-semibold text-brand-navy-dark";
const TEXTAREA_CLASS =
  "safe-input-focus p-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted resize-none";

export function ActivateRescueNotesSection({
  hasGuardian,
  onHasGuardianChange,
  rescueNotes,
  onRescueNotesChange,
  frequentLocation,
  onFrequentLocationChange,
  vehicleInfo,
  onVehicleInfoChange,
  disabled = false,
}: ActivateRescueNotesSectionProps) {
  const { t } = useLocale();

  return (
    <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 hover:border-brand-border-strong transition-all">
      <div className="border-b border-brand-separator pb-3">
        <h3 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
          5. {t.activate.rescueNotesLabel}
        </h3>
        <p className="font-sans text-xs text-brand-text-desc mt-0.5">
          {t.activate.rescueNotesNotice}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Checkbox: ¿El usuario tiene tutor? */}
        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none p-3 rounded-lg border border-brand-border-field bg-brand-bg-alt hover:bg-brand-white transition-all">
          <input
            type="checkbox"
            checked={hasGuardian}
            onChange={(e) => onHasGuardianChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-brand-border-field text-brand-navy-dark accent-brand-navy-dark cursor-pointer flex-shrink-0"
          />
          <span className="font-sans text-xs font-semibold text-brand-navy-dark">
            {t.activate.hasGuardianLabel}
          </span>
        </label>

        {/* Notas de rescate */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.rescueNotesLabel}</label>
          <textarea
            rows={3}
            value={rescueNotes}
            onChange={(e) => onRescueNotesChange(e.target.value)}
            disabled={disabled}
            placeholder={t.activate.rescueNotesPlaceholder}
            className={TEXTAREA_CLASS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lugar de uso frecuente */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>{t.activate.frequentLocationLabel}</label>
            <input
              type="text"
              autoCapitalize="sentences"
              value={frequentLocation}
              onChange={(e) => onFrequentLocationChange(e.target.value)}
              disabled={disabled}
              placeholder={t.activate.frequentLocationPlaceholder}
              className={INPUT_CLASS}
            />
          </div>

          {/* Información vehicular / placa */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>{t.activate.vehicleInfoLabel}</label>
            <input
              type="text"
              autoCapitalize="characters"
              value={vehicleInfo}
              onChange={(e) => onVehicleInfoChange(e.target.value)}
              disabled={disabled}
              placeholder={t.activate.vehicleInfoPlaceholder}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
