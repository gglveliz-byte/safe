/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Sección 1: PIN y Credenciales de Acceso
 * ARCHIVO: src/app/activate/[code]/ActivatePinAccountSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Recopila y valida la primera fase del registro de un kit virgen:
 * (1) PIN confidencial de 6 dígitos (teclado numérico, soporte para auto-rellenado
 *     desde el código QR con distintivo visual oficial),
 * (2) Correo electrónico de la cuenta,
 * (3) Contraseña de acceso (mínimo 8 caracteres),
 * (4) Confirmación obligatoria de contraseña para evitar bloqueos por errores
 *     tipográficos en dispositivos móviles.
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

export interface ActivatePinAccountSectionProps {
  pin: string;
  onPinChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (val: string) => void;
  disabled?: boolean;
}

const INPUT_CLASS =
  "safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted";
const LABEL_CLASS = "font-sans text-xs font-semibold text-brand-navy-dark";

export function ActivatePinAccountSection({
  pin,
  onPinChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  disabled = false,
}: ActivatePinAccountSectionProps) {
  const { t } = useLocale();

  return (
    <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 hover:border-brand-border-strong transition-all">
      <div className="border-b border-brand-separator pb-3">
        <h3 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
          1. {t.activate.stepPinTitle}
        </h3>
        <p className="font-sans text-xs text-brand-text-desc mt-0.5">
          {t.activate.pinHelp}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PIN de 6 dígitos */}
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <label className={LABEL_CLASS}>{t.activate.pinLabel} *</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            disabled={disabled}
            value={pin}
            onChange={(event) => onPinChange(event.target.value.replace(/\D/g, ""))}
            placeholder={t.activate.pinPlaceholder}
            className="safe-input-focus h-11 min-h-[44px] px-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-xl font-bold tracking-widest text-center text-brand-navy-dark"
          />
        </div>

        {/* Correo electrónico */}
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <label className={LABEL_CLASS}>{t.activate.emailLabel} *</label>
          <input
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
            required
            disabled={disabled}
            className={INPUT_CLASS}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder={t.activate.emailPlaceholder}
          />
        </div>

        {/* Contraseña */}
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <label className={LABEL_CLASS}>{t.activate.passwordLabel} *</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={disabled}
            className={INPUT_CLASS}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder={t.activate.passwordPlaceholder}
          />
        </div>

        {/* Confirmación de contraseña */}
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <label className={LABEL_CLASS}>{t.activate.confirmPasswordLabel} *</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={disabled}
            className={INPUT_CLASS}
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            placeholder={t.activate.confirmPasswordPlaceholder}
          />
        </div>
      </div>
    </div>
  );
}
