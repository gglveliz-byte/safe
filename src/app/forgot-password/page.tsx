/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — Recuperación de Contraseña (/forgot-password)
 * ARCHIVO: src/app/forgot-password/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Vista pública para solicitar el restablecimiento de contraseña de la cuenta
 * SAFE. Presenta la estética broadsheet Incident, captura el correo registrado,
 * valida el formato con Zod en el backend y emite el enlace temporal vía Gmail
 * SMTP con protección de rate limiting y anti-enumeración de usuarios.
 *
 * ENTRADAS: correo electrónico del usuario vía formulario.
 * SALIDAS: despacho del correo de recuperación y confirmación en pantalla.
 * DEPENDENCIAS: useLocale, useHaptic, apiClient, IncidentCard, IncidentButton.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos hardcodeados (100% t vía useLocale).
 * - Objetivos táctiles mínimos de 44x44px y háptica en cada interacción.
 * ==============================================================================
 */

"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";

export default function ForgotPasswordPage() {
  const { t, locale } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    triggerHaptic("light");

    try {
      await apiClient.requestPasswordReset(email, locale);
      triggerHaptic("success");
      setIsSubmitted(true);
    } catch (err: unknown) {
      triggerHaptic("error");
      const message =
        err instanceof Error ? err.message : t.common.errorGeneric;
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="safe-mobile-container py-12 flex flex-col items-center justify-center min-h-[75vh]">
      <IncidentCard padding="lg" className="w-full max-w-md flex flex-col gap-6">
        {/* Cabecera Editorial Incident */}
        <div className="flex flex-col gap-1 border-b border-ink pb-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-orange" aria-hidden="true" />
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-carbon">
              {t.forgotPassword.badge}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
            {t.forgotPassword.title}
          </h1>
          <p className="font-sans text-micro text-carbon">
            {t.forgotPassword.subtitle}
          </p>
        </div>

        {isSubmitted ? (
          /* Estado de Confirmación */
          <div className="flex flex-col gap-6">
            <div
              className="p-4 bg-paper border border-ink rounded-[4px] shadow-sm flex flex-col gap-2"
              role="status"
            >
              <div className="flex items-center gap-2 text-ink font-bold font-sans text-micro uppercase">
                <span className="text-signal-orange" aria-hidden="true">✓</span>
                <span>{t.forgotPassword.badge}</span>
              </div>
              <p className="font-sans text-micro text-ink leading-relaxed">
                {t.forgotPassword.successNotice}
              </p>
            </div>

            <Link
              href="/login"
              onClick={() => triggerHaptic("light")}
              className="btn-neutral w-full text-center no-underline text-micro font-bold py-3 min-h-[44px] flex items-center justify-center"
            >
              ← {t.forgotPassword.backToLogin}
            </Link>
          </div>
        ) : (
          /* Formulario de Solicitud */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.forgotPassword.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.forgotPassword.emailPlaceholder}
                required
                autoComplete="email"
                autoFocus
                className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            {errorMessage && (
              <div
                className="banner-emergency text-micro text-alert-red font-sans text-center"
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
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading
                  ? t.forgotPassword.submittingButton
                  : t.forgotPassword.submitButton}
              </IncidentButton>
            </div>

            <div className="pt-2 border-t border-mist flex justify-center">
              <Link
                href="/login"
                onClick={() => triggerHaptic("light")}
                className="inline-flex items-center min-h-[44px] text-micro text-carbon hover:text-ink transition-colors font-sans"
              >
                ← {t.forgotPassword.backToLogin}
              </Link>
            </div>
          </form>
        )}
      </IncidentCard>
    </div>
  );
}
