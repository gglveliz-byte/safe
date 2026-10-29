/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Sección 4: Ficha Médica, Alergias y Antecedentes
 * ARCHIVO: src/app/activate/[code]/ActivateMedicalSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Recopila los datos clínicos de soporte para la Hora Dorada del siniestro vial:
 * (1) Grupo sanguíneo y factor RH (con opción 'OTRO' para variantes hematológicas),
 * (2) Aseguradora o póliza de salud,
 * (3) Alergias severas (fármacos, alimentos, látex),
 * (4) Padecimientos crónicos o diagnósticos preexistentes,
 * (5) Medicamentos en uso regular,
 * (6) Hallazgos médicos / cirugías previas / implantes,
 * (7) Manifestación explícita de voluntad de donación de órganos.
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
import { BLOOD_TYPES } from "@/lib/schemas/common.schema";

export interface ActivateMedicalSectionProps {
  bloodType: string;
  onBloodTypeChange: (val: string) => void;
  customBloodType: string;
  onCustomBloodTypeChange: (val: string) => void;
  insuranceInfo: string;
  onInsuranceInfoChange: (val: string) => void;
  allergies: string;
  onAllergiesChange: (val: string) => void;
  chronicConditions: string;
  onChronicConditionsChange: (val: string) => void;
  medications: string;
  onMedicationsChange: (val: string) => void;
  medicalFindings: string;
  onMedicalFindingsChange: (val: string) => void;
  isOrganDonor: boolean;
  onIsOrganDonorChange: (val: boolean) => void;
  disabled?: boolean;
}

const INPUT_CLASS =
  "safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted";
const LABEL_CLASS = "font-sans text-xs font-semibold text-brand-navy-dark";
const TEXTAREA_CLASS =
  "safe-input-focus p-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted resize-none";

export function ActivateMedicalSection({
  bloodType,
  onBloodTypeChange,
  customBloodType,
  onCustomBloodTypeChange,
  insuranceInfo,
  onInsuranceInfoChange,
  allergies,
  onAllergiesChange,
  chronicConditions,
  onChronicConditionsChange,
  medications,
  onMedicationsChange,
  medicalFindings,
  onMedicalFindingsChange,
  isOrganDonor,
  onIsOrganDonorChange,
  disabled = false,
}: ActivateMedicalSectionProps) {
  const { t } = useLocale();

  return (
    <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 hover:border-brand-border-strong transition-all">
      <div className="border-b border-brand-separator pb-3">
        <h3 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
          4. {t.dashboard.editMedicalTitle}
        </h3>
        <p className="font-sans text-xs text-brand-text-desc mt-0.5">
          {t.dashboard.editMedicalSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Grupo sanguíneo */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.bloodTypeLabel} *</label>
          <select
            value={bloodType}
            required
            disabled={disabled}
            onChange={(event) => onBloodTypeChange(event.target.value)}
            className="safe-input-focus h-11 min-h-[44px] px-3 bg-brand-white border border-brand-border-field rounded-lg font-serif text-base font-bold text-brand-navy-dark cursor-pointer disabled:opacity-50"
          >
            <option value="" disabled>
              {t.activate.bloodTypeLabel}
            </option>
            {BLOOD_TYPES.map((bloodTypeOption) => (
              <option key={bloodTypeOption} value={bloodTypeOption}>
                {bloodTypeOption}
              </option>
            ))}
          </select>
          {bloodType === "OTRO" && (
            <input
              type="text"
              required
              disabled={disabled}
              className={`${INPUT_CLASS} mt-1.5`}
              value={customBloodType}
              onChange={(event) => onCustomBloodTypeChange(event.target.value)}
              placeholder={t.activate.customBloodTypePlaceholder}
            />
          )}
        </div>

        {/* Seguro de salud */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.insuranceLabel}</label>
          <input
            type="text"
            disabled={disabled}
            className={INPUT_CLASS}
            value={insuranceInfo}
            onChange={(event) => onInsuranceInfoChange(event.target.value)}
            placeholder={t.activate.insurancePlaceholder}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Alergias */}
        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-xs font-semibold text-brand-accent">
            {t.activate.allergiesLabel}
          </label>
          <textarea
            rows={3}
            disabled={disabled}
            className={TEXTAREA_CLASS}
            value={allergies}
            onChange={(event) => onAllergiesChange(event.target.value)}
            placeholder={t.activate.allergiesPlaceholder}
          />
        </div>

        {/* Condiciones crónicas */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.conditionsLabel}</label>
          <textarea
            rows={3}
            disabled={disabled}
            className={TEXTAREA_CLASS}
            value={chronicConditions}
            onChange={(event) => onChronicConditionsChange(event.target.value)}
            placeholder={t.activate.conditionsPlaceholder}
          />
        </div>

        {/* Medicamentos */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.medicationsLabel}</label>
          <textarea
            rows={3}
            disabled={disabled}
            className={TEXTAREA_CLASS}
            value={medications}
            onChange={(event) => onMedicationsChange(event.target.value)}
            placeholder={t.activate.medicationsPlaceholder}
          />
        </div>
      </div>

      {/* Hallazgos médicos y Checkbox Donante de Órganos */}
      <div className="flex flex-col gap-3 pt-2 border-t border-brand-separator">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.medicalFindingsLabel}</label>
          <input
            type="text"
            disabled={disabled}
            value={medicalFindings}
            onChange={(e) => onMedicalFindingsChange(e.target.value)}
            placeholder={t.activate.medicalFindingsPlaceholder}
            className={INPUT_CLASS}
          />
        </div>

        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none p-3 rounded-lg border border-brand-border-field bg-brand-bg-alt hover:bg-brand-white transition-all">
          <input
            type="checkbox"
            disabled={disabled}
            checked={isOrganDonor}
            onChange={(e) => onIsOrganDonorChange(e.target.checked)}
            className="h-4 w-4 rounded border-brand-border-field text-brand-navy-dark accent-brand-navy-dark cursor-pointer flex-shrink-0"
          />
          <span className="font-sans text-xs font-bold text-brand-navy-dark">
            ❤️ {t.activate.organDonorLabel}
          </span>
        </label>
      </div>
    </div>
  );
}
