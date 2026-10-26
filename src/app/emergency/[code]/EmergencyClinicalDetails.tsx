/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Frente Vial — Ficha Clínica y Antecedentes de Emergencia
 * ARCHIVO: src/app/emergency/[code]/EmergencyClinicalDetails.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza el bloque central de la ficha médica pública:
 * (1) Fotografía y datos de identificación, edad, país/ciudad y donante de órganos,
 * (2) Grupo sanguíneo y alergias severas (alto contraste solar),
 * (3) Padecimientos crónicos y medicamentos,
 * (4) Notas de rescate, observaciones clínicas e información vehicular.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo ~160 líneas).
 * - Cero textos hardcodeados: 100% diccionario vía useLocale().
 * - Máximo contraste solar y legibilidad inmediata para socorristas.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { MedicalBadge } from "@/components/medical/MedicalBadge";
import type { PublicEmergencyProfileDTO } from "./emergency-api";

export interface EmergencyClinicalDetailsProps {
  medical: PublicEmergencyProfileDTO["profile"];
  updatedAtLabel: string;
}

export function EmergencyClinicalDetails({
  medical,
  updatedAtLabel,
}: EmergencyClinicalDetailsProps) {
  const { locale, t } = useLocale();

  return (
    <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-6">
      {/* Cabecera con fotografía de reconocimiento y datos del titular */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-brand-separator">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-brand-border-subtle overflow-hidden bg-brand-bg-alt flex-shrink-0 flex items-center justify-center shadow-xs">
          {medical.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={medical.photoUrl} alt={t.activate.photoLabel} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl" aria-hidden="true">👤</span>
          )}
        </div>
        <div className="flex flex-col text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-sans text-xs uppercase tracking-wider text-brand-text-muted font-bold">
              {t.emergency.subtitle}
            </span>
            {medical.isOrganDonor && (
              <span className="font-sans text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                ❤️ {t.activate.organDonorBadge}
              </span>
            )}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy-dark leading-tight mt-0.5 truncate">
            {medical.fullName}
          </h2>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1 text-xs font-sans text-brand-text-desc">
            <span>
              {t.emergency.nationalId}: <strong className="text-brand-navy-dark font-bold">{medical.nationalIdMasked}</strong>
            </span>
            {medical.age && (
              <>
                <span>•</span>
                <span>
                  {t.activate.ageLabel}: <strong className="text-brand-navy-dark font-bold">{medical.age}</strong>
                </span>
              </>
            )}
            {(medical.city || medical.country) && (
              <>
                <span>•</span>
                <span className="text-brand-navy-dark font-semibold">
                  📍 {[medical.city, medical.country].filter(Boolean).join(", ")}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-1 text-xs font-sans text-brand-text-desc">
            <span>
              {t.emergency.insurance}: <strong className="text-brand-navy-dark font-bold">{medical.insuranceInfo ?? t.emergency.noInsurance}</strong>
            </span>
            <span>•</span>
            <span className="text-[11px] text-brand-text-muted">{updatedAtLabel}</span>
          </div>
        </div>
      </div>

      {/* Grupo sanguíneo y alergias severas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MedicalBadge label={t.emergency.bloodType} value={medical.bloodType} isCritical={true} />
        <MedicalBadge
          label={t.emergency.allergies}
          value={medical.allergies ?? t.emergency.noAllergies}
          isWarning={medical.allergies !== null}
        />
      </div>

      {/* Patologías y medicamentos prescritos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-brand-bg-alt border border-brand-border-subtle rounded-xl">
          <span className="font-sans text-xs uppercase font-bold text-brand-text-muted block mb-1">
            {t.emergency.conditions}
          </span>
          <p className="font-sans text-sm font-semibold text-brand-navy-dark leading-snug">
            {medical.chronicConditions ?? t.emergency.noConditions}
          </p>
        </div>
        <div className="p-4 bg-brand-bg-alt border border-brand-border-subtle rounded-xl">
          <span className="font-sans text-xs uppercase font-bold text-brand-text-muted block mb-1">
            {t.emergency.medications}
          </span>
          <p className="font-sans text-sm font-semibold text-brand-navy-dark leading-snug">
            {medical.medications ?? t.emergency.noMedications}
          </p>
        </div>
      </div>

      {/* Notas de rescate vitales para paramédicos */}
      {medical.rescueNotes && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-1">
          <span className="font-sans text-xs uppercase font-bold text-amber-900 flex items-center gap-1.5">
            ⚠️ {t.activate.rescueNotesLabel}
          </span>
          <p className="font-sans text-sm font-semibold text-amber-950 leading-snug">
            {medical.rescueNotes}
          </p>
        </div>
      )}

      {/* Hallazgos médicos y antecedentes */}
      {medical.medicalFindings && (
        <div className="p-4 bg-brand-bg-alt border border-brand-border-subtle rounded-xl flex flex-col gap-1">
          <span className="font-sans text-xs uppercase font-bold text-brand-text-muted">
            {t.activate.medicalFindingsLabel}
          </span>
          <p className="font-sans text-sm font-semibold text-brand-navy-dark leading-snug">
            {medical.medicalFindings}
          </p>
        </div>
      )}

      {/* Vehículo y lugar de uso frecuente */}
      {(medical.vehicleInfo || medical.frequentLocation) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-brand-bg-alt border border-brand-border-subtle rounded-xl text-xs">
          {medical.vehicleInfo && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-brand-text-muted">🏍️ {t.activate.vehicleInfoLabel}:</span>
              <span className="font-mono font-bold text-brand-navy-dark">{medical.vehicleInfo}</span>
            </div>
          )}
          {medical.frequentLocation && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-brand-text-muted">📍 {t.activate.frequentLocationLabel}:</span>
              <span className="font-sans font-semibold text-brand-navy-dark">{medical.frequentLocation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
