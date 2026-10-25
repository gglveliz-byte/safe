/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — Recuperación de Contraseña (/forgot-password) (SAFE 2026)
 * ARCHIVO: src/app/forgot-password/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Vista pública para solicitar el restablecimiento de contraseña de la cuenta
 * SAFE. Presenta la estética broadsheet 2026, captura el correo registrado,
 * valida el formato con Zod en el backend y emite el enlace temporal vía Gmail
 * SMTP con protección de rate limiting y anti-enumeración de usuarios.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 170 líneas).
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
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-8 shadow-sm hover:border-brand-border-strong hover:shadow transition-all duration-300 flex flex-col gap-6 animate-fadeInUp">
        {/* Cabecera Editorial */}
        <div className="flex flex-col gap-1.5 border-b border-brand-separator pb-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" aria-hidden="true" />
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-brand-text-muted">
              {t.forgotPassword.badge}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy-dark leading-tight">
            {t.forgotPassword.title}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-brand-text-desc">
            {t.forgotPassword.subtitle}
          </p>
        </div>

        {isSubmitted ? (
          /* Estado de Confirmación */
          <div className="flex flex-col gap-6 animate-fadeInDown">
            <div
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow-xs flex flex-col gap-2"
              role="status"
            >
              <div className="flex items-center gap-2 text-emerald-900 font-bold font-sans text-xs uppercase">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]" aria-hidden="true">✓</span>
                <span>{t.forgotPassword.badge}</span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-emerald-800">
                {t.forgotPassword.successNotice}
              </p>
            </div>

            <Link
              href="/login"
              onClick={() => triggerHaptic("light")}
              className="w-full min-h-[44px] inline-flex items-center justify-center px-6 py-3 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-sm font-semibold rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue no-underline"
            >
              ← {t.forgotPassword.backToLogin}
            </Link>
          </div>
        ) : (
          /* Formulario de Solicitud */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.forgotPassword.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.forgotPassword.emailPlaceholder}
                required
                autoComplete="email"
                className="safe-input-focus w-full h-11 px-4 bg-brand-white border border-brand-border-field rounded-md font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
              />
            </div>

            {errorMessage && (
              <div
                className="text-xs rounded-md p-3.5 bg-red-50 text-red-700 border border-red-200 block animate-fadeInDown"
                role="alert"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] inline-flex items-center justify-center px-6 py-3 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-sm font-semibold rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? t.forgotPassword.submittingButton : t.forgotPassword.submitButton}</span>
                {isLoading && (
                  <svg className="animate-spin ml-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-brand-separator text-center">
              <Link
                href="/login"
                onClick={() => triggerHaptic("light")}
                className="inline-flex items-center min-h-[44px] text-xs font-sans text-brand-text-muted hover:text-brand-navy-dark transition-colors no-underline"
              >
                ← {t.forgotPassword.backToLogin}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
