/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI — Selector Universal de Países (Incident 2026)
 * ARCHIVO: src/components/ui/CountrySelect.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Selector canónico de países del mundo poblado automáticamente desde
 * `src/lib/countries-data.ts`. Muestra la bandera nacional, el nombre oficial
 * y el código ISO. Totalmente bilingüe (español e inglés) y optimizado para
 * táctiles móviles de 44px conforme a `safe-incident-design-system`.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos en duro; integración con useLocale().
 * - Táctiles ≥44px y diseño accesible.
 * ==============================================================================
 */

"use client";

import React from "react";
import { COUNTRIES, CountryItem } from "@/lib/countries-data";
import { useLocale } from "@/hooks/useLocale";

export interface CountrySelectProps {
  value: string; // ISO 2-letter code (ej. "EC", "CO", "MX")
  onChange: (countryCode: string, country: CountryItem) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
}

export function CountrySelect({
  value,
  onChange,
  disabled = false,
  required = false,
  id,
  className = "",
  placeholder,
}: CountrySelectProps) {
  const { locale, t } = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const item = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
    onChange(code, item);
  };

  const defaultPlaceholder = placeholder || t.activate.countryPlaceholder;

  return (
    <div className="relative w-full">
      <select
        id={id}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={`safe-input-focus w-full h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-9 ${className}`}
      >
        <option value="" disabled>
          {defaultPlaceholder}
        </option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {locale === "es" ? c.name : c.nameEn} ({c.dialCode})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-text-muted">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
