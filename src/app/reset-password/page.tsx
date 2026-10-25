/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — Restablecimiento de Contraseña (/reset-password)
 * ARCHIVO: src/app/reset-password/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Vista pública para ingresar la nueva contraseña usando el token temporal
 * recibido por correo electrónico. Valida la coincidencia de campos en tiempo
 * real, ejecuta la llamada criptográfica al backend y redirige al inicio de sesión.
 *
 * ENTRADAS: token vía query parameter (?token=...) y nueva contraseña.
 * SALIDAS: actualización de contraseña en PostgreSQL y redirección a /login.
 * DEPENDENCIAS: useLocale, useHaptic, apiClient, IncidentCard, IncidentButton.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos hardcodeados (100% t vía useLocale).
 * - Objetivos táctiles mínimos de 44x44px y háptica en cada interacción.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, Suspense, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";

function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Redirección automática tras éxito
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      router.push("/login");
    }, 3500);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      triggerHaptic("error");
      setErrorMessage(t.resetPassword.errorTokenInvalid);
      return;
    }

    if (password.length < 8) {
      triggerHaptic("error");
      setErrorMessage(t.resetPassword.passwordPlaceholder);
      return;
    }

    if (password !== confirmPassword) {
      triggerHaptic("error");
      setErrorMessage(t.resetPassword.errorPasswordsMismatch);
      return;
    }

    setIsLoading(true);
    triggerHaptic("light");

    try {
      await apiClient.resetPassword({
        token,
        password,
        confirmPassword,
      });
      triggerHaptic("success");
      setIsSuccess(true);
    } catch (err: unknown) {
      triggerHaptic("error");
      const message =
        err instanceof Error ? err.message : t.resetPassword.errorTokenInvalid;
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
              {t.resetPassword.badge}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
            {t.resetPassword.title}
          </h1>
          <p className="font-sans text-micro text-carbon">
            {t.resetPassword.subtitle}
          </p>
        </div>

        {!token ? (
          /* Error de Token Ausente */
          <div className="flex flex-col gap-4">
            <div
              className="banner-emergency text-micro text-alert-red font-sans text-center"
              role="alert"
            >
              ⚠️ {t.resetPassword.errorTokenInvalid}
            </div>
            <Link
              href="/forgot-password"
              onClick={() => triggerHaptic("light")}
              className="btn-neutral w-full text-center no-underline text-micro font-bold py-3 min-h-[44px] flex items-center justify-center"
            >
              ← {t.forgotPassword.submitButton}
            </Link>
          </div>
        ) : isSuccess ? (
          /* Estado de Éxito */
          <div className="flex flex-col gap-6">
            <div
              className="p-4 bg-paper border border-ink rounded-[4px] shadow-sm flex flex-col gap-2"
              role="status"
            >
              <div className="flex items-center gap-2 text-ink font-bold font-sans text-micro uppercase">
                <span className="text-signal-orange" aria-hidden="true">✓</span>
                <span>{t.resetPassword.badge}</span>
              </div>
              <p className="font-sans text-micro text-ink leading-relaxed">
                {t.resetPassword.successNotice}
              </p>
            </div>

            <Link
              href="/login"
              onClick={() => triggerHaptic("light")}
              className="btn-neutral w-full text-center no-underline text-micro font-bold py-3 min-h-[44px] flex items-center justify-center"
            >
              {t.resetPassword.goToLogin} →
            </Link>
          </div>
        ) : (
          /* Formulario de Nueva Contraseña */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.resetPassword.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.resetPassword.passwordPlaceholder}
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
                className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.resetPassword.confirmPasswordLabel}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.resetPassword.confirmPasswordPlaceholder}
                required
                minLength={8}
                autoComplete="new-password"
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
                  ? t.resetPassword.submittingButton
                  : t.resetPassword.submitButton}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="safe-mobile-container min-h-[75vh] flex items-center justify-center">
          <span className="w-4 h-4 rounded-full bg-signal-orange animate-ping" aria-hidden="true" />
        </div>
      }
    >
      <ResetPasswordScreen />
    </Suspense>
  );
}
