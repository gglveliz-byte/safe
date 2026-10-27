/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 4: Inicio de Sesión del Motociclista y Admin (SAFE 2026)
 * ARCHIVO: src/app/login/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pantalla de acceso privado para pilotos registrados y administradores.
 * Valida credenciales contra PostgreSQL mediante Bcrypt, recibe cookie HttpOnly
 * segura y redirige dinámicamente según el rol (/admin o /dashboard).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 240 líneas).
 * - Cero jerga técnica visible al usuario.
 * - Integración con useLocale, useHaptic y diseño SAFE 2026.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import { BrandLogo } from "@/components/ui/BrandLogo";

function isSafeInternalPath(path: string | null): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const redirectParam = searchParams.get("redirect");
  const safeRedirect = isSafeInternalPath(redirectParam) ? redirectParam : null;

  useEffect(() => {
    let isMounted = true;
    async function checkExistingSession() {
      try {
        const session = await apiClient.getSession();
        if (isMounted && session.authenticated && session.user) {
          if (safeRedirect === "/admin" && session.user.role !== "ADMIN") {
            return;
          }
          const destination =
            safeRedirect ||
            (session.user.role === "ADMIN" ? "/admin" : "/dashboard");
          router.replace(destination);
        }
      } catch {
        // Continuar en pantalla de login si no hay sesión
      }
    }
    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, [router, safeRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    triggerHaptic("light");

    try {
      const res = await apiClient.login({ email, password });
      triggerHaptic("success");

      const destination =
        res.redirect ||
        safeRedirect ||
        (res.user?.role === "ADMIN" ? "/admin" : "/dashboard");
      router.push(destination);
    } catch (err: unknown) {
      triggerHaptic("error");
      const message =
        err instanceof Error ? err.message : t.login.errorInvalidCredentials;
      setErrorMessage(message || t.login.errorInvalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-8 shadow-sm hover:border-brand-border-strong hover:shadow transition-all duration-300 flex flex-col gap-6 animate-fadeInUp">
        {/* Cabecera Editorial */}
        <div className="flex flex-col gap-1.5 border-b border-brand-separator pb-4 text-center">
          <div className="flex justify-center mb-2">
            <BrandLogo size="lg" ringVariant="accent" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" aria-hidden="true" />
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-brand-text-muted">
              {t.common.riderLogin}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy-dark leading-tight">
            {t.login.title}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-brand-text-desc">
            {t.login.subtitle}
          </p>
        </div>

        {/* Formulario de Acceso */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-brand-navy-dark">
              {t.login.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              required
              autoComplete="email"
              className="safe-input-focus w-full h-11 px-4 bg-brand-white border border-brand-border-field rounded-md font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                {t.login.passwordLabel}
              </label>
              <Link
                href="/forgot-password"
                onClick={() => triggerHaptic("light")}
                className="font-sans text-xs text-brand-nav-blue hover:underline transition-colors no-underline"
              >
                {t.login.forgotPasswordLink}
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.login.passwordPlaceholder}
              required
              autoComplete="current-password"
              className="safe-input-focus w-full h-11 px-4 bg-brand-white border border-brand-border-field rounded-md font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
            />
          </div>

          {/* Banner de error */}
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
              <span>{isLoading ? t.login.submittingButton : t.login.submitButton}</span>
              {isLoading && (
                <svg className="animate-spin ml-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Enlaces de Ayuda y Activación */}
        <div className="pt-2 border-t border-brand-separator flex flex-col items-center gap-2 text-xs font-sans text-center">
          <Link
            href="/#activar-casco"
            className="inline-flex items-center min-h-[44px] text-brand-navy-dark hover:text-brand-accent font-semibold underline decoration-brand-border-strong underline-offset-4 transition-colors"
          >
            {t.login.needHelpActivation}
          </Link>

          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] text-brand-text-muted hover:text-brand-navy-dark transition-colors no-underline"
          >
            ← {t.login.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <span className="w-5 h-5 rounded-full bg-brand-accent animate-ping" aria-hidden="true" />
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
