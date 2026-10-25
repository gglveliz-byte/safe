/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Dashboard — Formulario de Edición de la Ficha Médica
 * ARCHIVO: src/components/dashboard/MedicalRecordForm.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Módulo extraído de src/app/dashboard/page.tsx por la partición obligatoria
 * C-19 (zona crítica 451-500 líneas). Contiene el formulario completo de
 * edición de la ficha médica protegida:
 * 1. Fotografía de rostro con subida real a Cloudinary (CloudinaryPhotoPicker).
 * 2. Datos clínicos: nombre, grupo sanguíneo, cédula, póliza, alergias,
 *    enfermedades preexistentes y medicamentos.
 * 3. Repetidor dinámico de contactos de aviso inmediato (ContactsRepeater).
 * 4. Banners de confirmación/error y botón de guardado (PUT /api/profile).
 *
 * ENTRADAS: perfil médico actual, callbacks de cambio/envío, estado de guardado
 * y mensajes transitorios de éxito/error (todo dinámico desde el orquestador).
 * SALIDAS: evento onSubmit con la ficha editada; la persistencia en PostgreSQL
 * ocurre en el orquestador (dashboard/page.tsx) vía apiClient.updateProfile.
 *
 * CORRECCIONES APLICADAS:
 * - M-19: el selector de grupo sanguíneo renderiza el catálogo canónico completo
 *   `BLOOD_TYPES` del backend (incluye DESCONOCIDO); prohibido duplicar la lista.
 * - C-16/M-1: banners fuera de paleta erradicados (bg-green-50/border-green-600/
 *   text-green-900 y bg-red-50). Éxito = concrete sobrio con borde ink;
 *   error = clase oficial .banner-emergency de globals.css (lavado alert-red).
 * - P-1 (2026-10-25): el selector arranca con la opción "aún no lo he
 *   declarado" en vez de preseleccionar "O+". Un grupo sanguíneo es un dato
 *   clínico: jamas puede sugerirse por defecto.
 * - P-6 (2026-10-25): se exponen los dos campos reales del backend que antes
 *   no eran editables desde el panel: fecha de nacimiento (birthDate) y
 *   teléfono de auxilio inmediato (emergencyNumber), el número que la ficha
 *   pública de rescate usa como destino de llamada.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero texto hardcodeado: 100% diccionario tipado `t` vía useLocale.
 * - Cero datos hardcodeados: catálogo sanguíneo desde common.schema.ts.
 * - Táctiles ≥ 44px (inputs h-11 = 44px, botón lg).
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import {
  type MedicalProfileData,
  type EmergencyContact,
} from "@/lib/api-client";
import { BLOOD_TYPES } from "@/lib/schemas/common.schema";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { CloudinaryPhotoPicker } from "@/components/medical/CloudinaryPhotoPicker";
import { ContactsRepeater } from "@/components/medical/ContactsRepeater";

/** Props públicos del formulario de edición de la ficha médica. */
export interface MedicalRecordFormProps {
  /** Perfil médico en edición (estado 100% dinámico del orquestador). */
  profile: MedicalProfileData;
  /** Callback de actualización inmutable del perfil. */
  onProfileChange: (profile: MedicalProfileData) => void;
  /** Callback de envío del formulario (persiste en el orquestador). */
  onSubmit: (event: React.FormEvent) => void;
  /** Guardado en curso: deshabilita controles y conmuta el texto del botón. */
  isSaving: boolean;
  /** Mensaje transitorio de éxito (cadena vacía oculta el banner). */
  noticeMessage: string;
  /** Mensaje transitorio de error (cadena vacía oculta el banner). */
  errorMessage: string;
}

/**
 * Convierte una fecha ISO (TIMESTAMPTZ del backend) al formato YYYY-MM-DD que
 * exige <input type="date">. Una fecha ausente o ilegible devuelve cadena
 * vacía: nunca se inventa un nacimiento por defecto.
 */
function toInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/**
 * Formulario de edición de la ficha médica registrada.
 * Delega la fotografía al selector Cloudinary real y los contactos al
 * repetidor genérico; todos los textos provienen del diccionario bilingüe.
 */
export function MedicalRecordForm({
  profile,
  onProfileChange,
  onSubmit,
  isSaving,
  noticeMessage,
  errorMessage,
}: MedicalRecordFormProps) {
  const { t } = useLocale();

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-heading-sm font-bold text-ink">
          {t.dashboard.editMedicalTitle}
        </h2>
        <p className="font-sans text-micro text-carbon mt-0.5">
          {t.dashboard.editMedicalSubtitle}
        </p>
      </div>

      {/* Selector de Fotografía de Rostro (subida real a Cloudinary) */}
      <CloudinaryPhotoPicker
        currentPhotoUrl={profile.photoUrl || undefined}
        onPhotoSelected={(url) => onProfileChange({ ...profile, photoUrl: url })}
        disabled={isSaving}
      />

      {/* Datos Clínicos Principales */}
      <IncidentCard padding="md" className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.activate.fullNameLabel}
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => onProfileChange({ ...profile, fullName: e.target.value })}
              required
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.activate.bloodTypeLabel}
            </label>
            {/* M-19: catálogo canónico completo del backend (incluye DESCONOCIDO).
                P-1: la primera opción está vacía; el sistema NUNCA preselecciona
                un grupo sanguíneo, porque sería un dato clínico inventado. */}
            <select
              value={profile.bloodType}
              onChange={(e) => onProfileChange({ ...profile, bloodType: e.target.value })}
              required
              className="h-11 px-3 bg-concrete border-2 border-ink rounded-[4px] font-serif text-body font-bold text-ink focus:outline-none cursor-pointer"
            >
              <option value="">{t.dashboard.bloodTypeUnset}</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.dashboard.birthDateLabel}
            </label>
            {/* P-6: fecha real del piloto; vacía = no declarada (cero inventos) */}
            <input
              type="date"
              value={toInputDate(profile.birthDate)}
              max={toInputDate(new Date().toISOString())}
              onChange={(e) =>
                onProfileChange({
                  ...profile,
                  birthDate: e.target.value
                    ? new Date(`${e.target.value}T00:00:00.000Z`).toISOString()
                    : null,
                })
              }
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.activate.nationalIdLabel}
            </label>
            <input
              type="text"
              value={profile.nationalId}
              onChange={(e) => onProfileChange({ ...profile, nationalId: e.target.value })}
              required
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.activate.insuranceLabel}
            </label>
            <input
              type="text"
              value={profile.insuranceInfo || profile.insurance || ""}
              onChange={(e) =>
                onProfileChange({
                  ...profile,
                  insuranceInfo: e.target.value,
                  insurance: e.target.value,
                })
              }
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {/* P-6: teléfono de auxilio inmediato. Es el destino real del botón de
              llamada de la ficha pública de rescate (EmergencyActionPanel). */}
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.dashboard.emergencyNumberLabel}
            </label>
            <input
              type="tel"
              value={profile.emergencyNumber || ""}
              onChange={(e) =>
                onProfileChange({ ...profile, emergencyNumber: e.target.value })
              }
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
            <p className="font-sans text-[11px] text-carbon">
              {t.dashboard.emergencyNumberHelp}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-alert-red">
              {t.activate.allergiesLabel}
            </label>
            <textarea
              rows={3}
              value={profile.allergies || ""}
              onChange={(e) => onProfileChange({ ...profile, allergies: e.target.value })}
              className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.activate.conditionsLabel}
            </label>
            <textarea
              rows={3}
              value={profile.chronicConditions || profile.conditions || ""}
              onChange={(e) =>
                onProfileChange({
                  ...profile,
                  chronicConditions: e.target.value,
                  conditions: e.target.value,
                })
              }
              className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.activate.medicationsLabel}
            </label>
            <textarea
              rows={3}
              value={profile.medications || ""}
              onChange={(e) => onProfileChange({ ...profile, medications: e.target.value })}
              className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
            />
          </div>
        </div>
      </IncidentCard>

      {/* Repetidor Dinámico de Contactos de Aviso Inmediato */}
      <ContactsRepeater
        contacts={profile.contacts}
        onChange={(newContacts: EmergencyContact[]) =>
          onProfileChange({ ...profile, contacts: newContacts })
        }
        disabled={isSaving}
      />

      {/* C-16/M-1: éxito sobrio en concrete/ink (paleta Incident, cero verdes) */}
      {noticeMessage && (
        <div
          className="p-4 bg-concrete border border-ink rounded-[8px] text-micro text-ink font-sans font-bold text-center"
          role="status"
        >
          ✓ {noticeMessage}
        </div>
      )}

      {/* C-16/M-1: error con la clase oficial .banner-emergency de globals.css */}
      {errorMessage && (
        <div
          className="banner-emergency text-micro text-alert-red font-sans font-bold text-center"
          role="alert"
        >
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="pt-2">
        <IncidentButton
          type="submit"
          variant="emergency"
          size="lg"
          isLoading={isSaving}
          disabled={isSaving}
          className="w-full sm:w-auto min-w-[240px]"
        >
          {isSaving ? t.common.saving : t.dashboard.saveProfileButton}
        </IncidentButton>
      </div>
    </form>
  );
}
