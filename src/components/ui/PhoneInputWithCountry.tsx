/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI — Entrada de Teléfono con Prefijo Internacional y Bandera
 * ARCHIVO: src/components/ui/PhoneInputWithCountry.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Campo compuesto de teléfono internacional conforme al sistema de diseño SAFE.
 * Integra un selector de país (bandera + prefijo telefónico ej. 🇪🇨 +593) con
 * el número local de abonado. Normaliza automáticamente la combinación hacia
 * el formato internacional canónico "+[código] [número]".
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 250 líneas).
 * - Cero datos hardcodeados: consume COUNTRIES de src/lib/countries-data.ts.
 * - Objetivos táctiles mínimos de 44px de altura.
 * - Bilingüe (inglés/español) y accesible.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useState } from "react";
import { COUNTRIES, CountryItem, DEFAULT_COUNTRY } from "@/lib/countries-data";
import { useLocale } from "@/hooks/useLocale";

export interface PhoneInputWithCountryProps {
  value: string; // Puede venir con formato "+593 991234567" o plano "0991234567"
  onChange: (fullPhone: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  defaultCountryCode?: string; // ej. "EC", "CO", "MX"
  className?: string;
}

/** Descompone un teléfono en prefijo internacional y número nacional */
function parsePhone(value: string, defaultDial: string): { dialCode: string; nationalNumber: string } {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) {
    // Si no tiene prefijo, asumimos el defaultDial y limpiamos el número
    return { dialCode: defaultDial, nationalNumber: trimmed };
  }

  // Buscar coincidencia de prefijo más largo
  for (const c of COUNTRIES) {
    if (trimmed.startsWith(c.dialCode)) {
      const rest = trimmed.slice(c.dialCode.length).trim();
      return { dialCode: c.dialCode, nationalNumber: rest };
    }
  }

  return { dialCode: defaultDial, nationalNumber: trimmed.replace(/^\+/, "") };
}

export function PhoneInputWithCountry({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  id,
  defaultCountryCode = "EC",
  className = "",
}: PhoneInputWithCountryProps) {
  const { locale } = useLocale();

  // Encontrar país por defecto
  const initialCountry =
    COUNTRIES.find((c) => c.code === defaultCountryCode.toUpperCase()) || DEFAULT_COUNTRY;

  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(initialCountry);
  const [nationalNumber, setNationalNumber] = useState<string>("");

  // Sincronizar estado interno si cambia el valor externo
  useEffect(() => {
    if (!value) {
      setNationalNumber("");
      return;
    }
    const parsed = parsePhone(value, selectedCountry.dialCode);
    const matchedCountry = COUNTRIES.find((c) => c.dialCode === parsed.dialCode);
    if (matchedCountry) {
      setSelectedCountry(matchedCountry);
    }
    setNationalNumber(parsed.nationalNumber);
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dialCode = e.target.value;
    const country = COUNTRIES.find((c) => c.dialCode === dialCode) || selectedCountry;
    setSelectedCountry(country);

    if (nationalNumber.trim()) {
      onChange(`${country.dialCode} ${nationalNumber.trim()}`);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setNationalNumber(raw);
    if (raw.trim()) {
      onChange(`${selectedCountry.dialCode} ${raw.trim()}`);
    } else {
      onChange("");
    }
  };

  const defaultPlaceholder = placeholder || (locale === "es" ? "Ej. 99 123 4567" : "Ex. 99 123 4567");

  return (
    <div className={`flex items-center gap-1.5 w-full ${className}`}>
      {/* Selector de prefijo de país con bandera y dialCode */}
      <div className="relative flex-shrink-0 w-28 sm:w-32">
        <select
          value={selectedCountry.dialCode}
          onChange={handleCountryChange}
          disabled={disabled}
          aria-label={locale === "es" ? "Prefijo internacional" : "Country calling code"}
          className="safe-input-focus w-full h-11 min-h-[44px] pl-2.5 pr-7 bg-brand-white border border-brand-border-field rounded-lg font-sans text-xs sm:text-sm font-semibold text-brand-navy-dark cursor-pointer disabled:opacity-50 appearance-none truncate"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.dialCode}>
              {c.flag} {c.dialCode} ({c.code})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-brand-text-muted">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Input del número nacional */}
      <div className="flex-1 min-w-0">
        <input
          id={id}
          type="tel"
          inputMode="tel"
          value={nationalNumber}
          onChange={handleNumberChange}
          disabled={disabled}
          required={required}
          placeholder={defaultPlaceholder}
          className="safe-input-focus w-full h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted disabled:opacity-50"
        />
      </div>
    </div>
  );
}
