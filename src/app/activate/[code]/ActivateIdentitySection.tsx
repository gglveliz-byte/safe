/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Sección 3: Identificación del Beneficiario y Residencia
 * ARCHIVO: src/app/activate/[code]/ActivateIdentitySection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Recopila la titularidad del chip físico (Para Mí, Hijo/a, Pareja, Familiar u Otro),
 * país de residencia (selector universal automático con banderas), teléfono móvil
 * con código internacional, edad, ciudad y dirección.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 250 líneas).
 * - Cero textos hardcodeados: 100% diccionario vía useLocale().
 * - Táctiles ≥44px y diseño BroadSheet Incident 2026.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";

export interface ActivateIdentitySectionProps {
  beneficiaryType: string;
  onBeneficiaryTypeChange: (val: string) => void;
  fullName: string;
  onFullNameChange: (val: string) => void;
  country: string;
  onCountryChange: (val: string) => void;
  city: string;
  onCityChange: (val: string) => void;
  residentialAddress: string;
  onResidentialAddressChange: (val: string) => void;
  riderPhone: string;
  onRiderPhoneChange: (val: string) => void;
  age: string;
  onAgeChange: (val: string) => void;
  nationalId: string;
  onNationalIdChange: (val: string) => void;
  disabled?: boolean;
}

const INPUT_CLASS =
  "safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted";
const LABEL_CLASS = "font-sans text-xs font-semibold text-brand-navy-dark";

export function ActivateIdentitySection({
  beneficiaryType,
  onBeneficiaryTypeChange,
  fullName,
  onFullNameChange,
  country,
  onCountryChange,
  city,
  onCityChange,
  residentialAddress,
  onResidentialAddressChange,
  riderPhone,
  onRiderPhoneChange,
  age,
  onAgeChange,
  nationalId,
  onNationalIdChange,
  disabled = false,
}: ActivateIdentitySectionProps) {
  const { t } = useLocale();

  return (
    <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 hover:border-brand-border-strong transition-all">
      <div className="border-b border-brand-separator pb-3">
        <h3 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
          3. {t.activate.beneficiaryLabel}
        </h3>
        <p className="font-sans text-xs text-brand-text-desc mt-0.5">
          {t.activate.beneficiaryNotice}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ¿Para quién es este chip? */}
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <label className={LABEL_CLASS}>{t.activate.beneficiaryLabel} *</label>
          <select
            value={beneficiaryType}
            onChange={(e) => onBeneficiaryTypeChange(e.target.value)}
            disabled={disabled}
            className="safe-input-focus h-11 min-h-[44px] px-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm font-semibold text-brand-navy-dark cursor-pointer"
          >
            <option value="SELF">{t.activate.beneficiarySelf}</option>
            <option value="CHILD">{t.activate.beneficiaryChild}</option>
            <option value="PARTNER">{t.activate.beneficiaryPartner}</option>
            <option value="FAMILY">{t.activate.beneficiaryFamily}</option>
            <option value="OTHER">{t.activate.beneficiaryOther}</option>
          </select>
        </div>

        {/* Nombre completo */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={LABEL_CLASS}>{t.activate.fullNameLabel} *</label>
          <input
            type="text"
            required
            autoComplete="name"
            autoCapitalize="words"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            disabled={disabled}
            placeholder={t.activate.fullNamePlaceholder}
            className={INPUT_CLASS}
          />
        </div>

        {/* País de residencia (todos los países del mundo automáticamente) */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.countryLabel} *</label>
          <CountrySelect
            value={country}
            onChange={(code) => onCountryChange(code)}
            disabled={disabled}
            required
          />
        </div>

        {/* Número celular con selector de país internacional */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={LABEL_CLASS}>{t.activate.riderPhoneLabel} *</label>
          <PhoneInputWithCountry
            value={riderPhone}
            onChange={onRiderPhoneChange}
            defaultCountryCode={country || "EC"}
            disabled={disabled}
            required
            placeholder={t.activate.riderPhonePlaceholder}
          />
        </div>

        {/* Edad (Años) */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.ageLabel} *</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={125}
            required
            value={age}
            onChange={(e) => onAgeChange(e.target.value)}
            disabled={disabled}
            placeholder={t.activate.agePlaceholder}
            className={INPUT_CLASS}
          />
        </div>

        {/* Ciudad / Provincia / Estado */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.cityLabel} *</label>
          <input
            type="text"
            required
            autoCapitalize="words"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={disabled}
            placeholder={t.activate.cityPlaceholder}
            className={INPUT_CLASS}
          />
        </div>

        {/* Documento de Identidad / Cédula */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>{t.activate.nationalIdLabel} *</label>
          <input
            type="text"
            required
            autoCapitalize="characters"
            value={nationalId}
            onChange={(e) => onNationalIdChange(e.target.value)}
            disabled={disabled}
            placeholder={t.activate.nationalIdPlaceholder}
            className={INPUT_CLASS}
          />
        </div>

        {/* Dirección de residencia (opcional) */}
        <div className="flex flex-col gap-1.5 sm:col-span-3">
          <label className={LABEL_CLASS}>{t.activate.addressLabel}</label>
          <input
            type="text"
            autoCapitalize="sentences"
            value={residentialAddress}
            onChange={(e) => onResidentialAddressChange(e.target.value)}
            disabled={disabled}
            placeholder={t.activate.addressPlaceholder}
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </div>
  );
}
