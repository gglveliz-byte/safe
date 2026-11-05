/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Ficha Médica — Sección de Acompañante Habitual / Copiloto
 * ARCHIVO: src/components/dashboard/CompanionSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente modular para el registro opcional de un único acompañante habitual
 * del motociclista. Almacena en la misma cuenta sus datos clínicos vitales,
 * fotografía facial y credencial oficial (anverso y reverso) para rescate vial.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Cero textos hardcodeados (100% resuelto con useLocale).
 * - Componentes Cloudinary reutilizados para fotos y documentos.
 * ==============================================================================
 */

"use client";

import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import type { CompanionData } from "@/lib/api-types";
import { BLOOD_TYPES } from "@/lib/schemas/common.schema";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { CloudinaryPhotoPicker } from "@/components/medical/CloudinaryPhotoPicker";
import { IdCardPhotoPicker } from "@/components/medical/IdCardPhotoPicker";

export interface CompanionSectionProps {
  companion?: CompanionData | null;
  onChange: (companion: CompanionData) => void;
  disabled?: boolean;
  deviceCode?: string;
}

export function CompanionSection({
  companion,
  onChange,
  disabled = false,
  deviceCode,
}: CompanionSectionProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const isEnabled = Boolean(companion?.isEnabled);

  const current: CompanionData = {
    isEnabled,
    fullName: companion?.fullName || "",
    nationalId: companion?.nationalId || "",
    relationship: companion?.relationship || "",
    phone: companion?.phone || "",
    bloodType: companion?.bloodType || "DESCONOCIDO",
    allergies: companion?.allergies || "",
    chronicConditions: companion?.chronicConditions || "",
    medications: companion?.medications || "",
    insuranceInfo: companion?.insuranceInfo || "",
    photoUrl: companion?.photoUrl || null,
    photoPublicId: companion?.photoPublicId || null,
    idCardFrontUrl: companion?.idCardFrontUrl || null,
    idCardFrontPublicId: companion?.idCardFrontPublicId || null,
    idCardBackUrl: companion?.idCardBackUrl || null,
    idCardBackPublicId: companion?.idCardBackPublicId || null,
    birthDate: companion?.birthDate || null,
  };

  const update = (patch: Partial<CompanionData>) => {
    onChange({ ...current, ...patch });
  };

  const handleToggle = () => {
    triggerHaptic(isEnabled ? "warning" : "success");
    update({ isEnabled: !isEnabled });
  };

  return (
    <IncidentCard padding="md" className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-brand-separator">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-brand-bg-alt border border-brand-border-subtle text-brand-navy-dark flex-shrink-0">
            <svg className="w-5 h-5 text-brand-navy-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-brand-navy-dark">
              {t.dashboard.companionTitle}
            </h3>
            <p className="font-sans text-xs text-brand-text-muted mt-0.5 leading-relaxed">
              {t.dashboard.companionSubtitle}
            </p>
          </div>
        </div>

        {/* Switch Interactivo */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2.5 cursor-pointer flex-shrink-0 ${
            isEnabled
              ? "bg-brand-navy-dark text-white border-brand-navy-dark shadow-xs"
              : "bg-brand-bg-alt text-brand-navy-dark border-brand-border-field hover:border-brand-border-strong"
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isEnabled ? "bg-emerald-400" : "bg-slate-300"}`} />
          <span>{isEnabled ? t.common.statusActive : t.dashboard.companionEnableToggle}</span>
        </button>
      </div>

      {!isEnabled ? (
        <div className="p-4 bg-brand-bg-alt border border-brand-border-subtle rounded-xl text-center">
          <p className="font-sans text-xs text-brand-text-muted">
            ℹ️ {t.dashboard.companionSubtitle}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-fadeInUp">
          {/* Fotografía de Rostro del Acompañante */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-xs font-semibold text-brand-navy-dark">
              {t.dashboard.companionPhotoLabel}
            </label>
            <CloudinaryPhotoPicker
              currentPhotoUrl={current.photoUrl || undefined}
              deviceCode={deviceCode}
              disabled={disabled}
              onPhotoSelected={(url, meta) =>
                update({ photoUrl: url, photoPublicId: meta?.photoPublicId || null })
              }
            />
          </div>

          {/* Datos Personales del Acompañante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.dashboard.companionFullName} *
              </label>
              <input
                type="text"
                autoComplete="name"
                value={current.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
                disabled={disabled}
                required
                className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.dashboard.companionRelationship}
              </label>
              <input
                type="text"
                value={current.relationship || ""}
                onChange={(e) => update({ relationship: e.target.value })}
                disabled={disabled}
                placeholder="Ej. Esposa, Pareja, Hijo, Hermano"
                className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.dashboard.companionNationalId}
              </label>
              <input
                type="text"
                value={current.nationalId || ""}
                onChange={(e) => update({ nationalId: e.target.value })}
                disabled={disabled}
                placeholder={t.activate.nationalIdPlaceholder}
                className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.dashboard.companionPhone}
              </label>
              <input
                type="tel"
                value={current.phone || ""}
                onChange={(e) => update({ phone: e.target.value })}
                disabled={disabled}
                placeholder="+593 9..."
                className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
              />
            </div>
          </div>

          {/* Credencial Oficial del Acompañante (Cédula Anverso y Reverso) */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-xs font-semibold text-brand-navy-dark">
              {t.dashboard.companionIdCardLabel}
            </label>
            <IdCardPhotoPicker
              frontUrl={current.idCardFrontUrl}
              frontPublicId={current.idCardFrontPublicId}
              backUrl={current.idCardBackUrl}
              backPublicId={current.idCardBackPublicId}
              deviceCode={deviceCode}
              disabled={disabled}
              onFrontChange={(url, publicId) =>
                update({ idCardFrontUrl: url, idCardFrontPublicId: publicId })
              }
              onBackChange={(url, publicId) =>
                update({ idCardBackUrl: url, idCardBackPublicId: publicId })
              }
            />
          </div>

          {/* Datos Médicos Críticos del Acompañante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.activate.bloodTypeLabel} *
              </label>
              <select
                value={current.bloodType}
                onChange={(e) => update({ bloodType: e.target.value })}
                disabled={disabled}
                className="safe-input-focus h-11 min-h-[44px] px-3 bg-brand-white border border-brand-border-field rounded-lg font-serif text-base font-bold text-brand-navy-dark cursor-pointer"
              >
                <option value="DESCONOCIDO">{t.dashboard.bloodTypeUnset}</option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.activate.insuranceLabel}
              </label>
              <input
                type="text"
                value={current.insuranceInfo || ""}
                onChange={(e) => update({ insuranceInfo: e.target.value })}
                disabled={disabled}
                placeholder={t.activate.insurancePlaceholder}
                className="safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-accent">
                {t.activate.allergiesLabel}
              </label>
              <textarea
                rows={2}
                value={current.allergies || ""}
                onChange={(e) => update({ allergies: e.target.value })}
                disabled={disabled}
                placeholder={t.activate.allergiesPlaceholder}
                className="safe-input-focus p-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.activate.conditionsLabel}
              </label>
              <textarea
                rows={2}
                value={current.chronicConditions || ""}
                onChange={(e) => update({ chronicConditions: e.target.value })}
                disabled={disabled}
                placeholder={t.activate.conditionsPlaceholder}
                className="safe-input-focus p-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.activate.medicationsLabel}
              </label>
              <textarea
                rows={2}
                value={current.medications || ""}
                onChange={(e) => update({ medications: e.target.value })}
                disabled={disabled}
                placeholder={t.activate.medicationsPlaceholder}
                className="safe-input-focus p-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted resize-none"
              />
            </div>
          </div>
        </div>
      )}
    </IncidentCard>
  );
}
