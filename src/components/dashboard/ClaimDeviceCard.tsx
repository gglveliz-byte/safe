/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Dashboard — Tarjeta de Vinculación y Activación de Chip (Fase 2)
 * ARCHIVO: src/components/dashboard/ClaimDeviceCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Tarjeta interactiva en el panel del motociclista que permite ingresar el
 * folio de su kit físico (ej. SAFE-0001) y su PIN confidencial de 6 dígitos
 * para activar y vincular su dispositivo a su cuenta ya autenticada.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (componente < 200 líneas).
 * - Cero mocks: invoca POST /api/devices/claim a través de apiClient.claimDevice.
 * - 100% bilingüe con useLocale; respuesta háptica y diseño Incident 2026.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import { IncidentAlertBanner } from "@/components/ui/IncidentAlertBanner";

export interface ClaimDeviceCardProps {
  prefilledCode?: string;
  onClaimSuccess: () => Promise<void> | void;
}

export function ClaimDeviceCard({
  prefilledCode = "",
  onClaimSuccess,
}: ClaimDeviceCardProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [code, setCode] = useState(prefilledCode);
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledCode) setCode(prefilledCode);
  }, [prefilledCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = code ? code.trim().toUpperCase() : undefined;
    const cleanPin = pin.trim();

    if (!cleanPin || cleanPin.length !== 6) {
      setErrorMessage(t.activate.errorPinInvalid);
      triggerHaptic("warning");
      return;
    }

    setIsSubmitting(true);
    triggerHaptic("light");

    try {
      const res = await apiClient.claimDevice({
        ...(cleanCode ? { code: cleanCode } : {}),
        pin: cleanPin,
      });

      if (!res.success) {
        throw new Error(res.message || t.activate.errorPinInvalid);
      }

      triggerHaptic("success");
      setSuccessMessage(t.dashboard.claimSuccess);
      await onClaimSuccess();
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : t.activate.errorPinInvalid;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-brand-white border-2 border-brand-accent/40 rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 animate-fadeInUp">
      <div className="flex items-start gap-3 border-b border-brand-separator pb-4">
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-xl bg-brand-nav-active border border-brand-border-subtle flex items-center justify-center text-2xl shrink-0"
        >
          ⛑️
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight">
            {t.dashboard.claimTitle}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-text-desc leading-relaxed">
            {t.dashboard.claimSubtitle}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {code && (
          <div className="flex items-center justify-center gap-2 py-0.5">
            <span className="font-sans text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">
              {t.dashboard.folioLabel || "Kit"}:
            </span>
            <span className="font-mono text-xs font-bold bg-brand-navy-dark text-white px-2.5 py-0.5 rounded shadow-xs tracking-wider">
              {code}
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-2.5 max-w-sm mx-auto w-full py-1">
          <label className="font-sans text-xs font-semibold text-brand-navy-dark text-center">
            {t.dashboard.claimPinLabel} *
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            disabled={isSubmitting}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder={t.dashboard.claimPinPlaceholder}
            className="safe-input-focus w-full h-14 min-h-[56px] px-4 bg-brand-white border-2 border-brand-navy-dark rounded-xl font-mono text-2xl font-bold tracking-[0.35em] text-center text-brand-navy-dark placeholder-brand-text-muted/40 shadow-inner"
          />
          <p className="font-sans text-xs text-brand-text-muted text-center">
            {t.dashboard.claimPinHelp}
          </p>
        </div>

        {errorMessage && (
          <IncidentAlertBanner type="emergency" message={errorMessage} />
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-sans text-emerald-800 font-semibold flex items-center gap-2">
            <span>✓</span> {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] inline-flex items-center justify-center px-6 py-3.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-1"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t.dashboard.claimingButton}
            </span>
          ) : (
            t.dashboard.claimButton
          )}
        </button>
      </form>
    </div>
  );
}
