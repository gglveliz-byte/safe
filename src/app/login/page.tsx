/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 4: Inicio de Sesión del Motociclista y Admin
 * ARCHIVO: src/app/login/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pantalla de acceso privado para pilotos registrados y administradores de flota.
 * Valida credenciales contra PostgreSQL mediante Bcrypt, recibe cookie HttpOnly
 * segura y redirige dinámicamente según el rol (/admin o /dashboard).
 *
 * CORRECCIONES CRÍTICAS APLICADAS:
 * - C-9: erradicado href="/activate/SAFE-0001" (folio fabricado que viola la
 *   Regla 1: la activación ocurre SOLO vía escaneo físico del casco). El enlace
 *   de ayuda apunta a la página principal, que contiene el formulario de folio real.
 * - C-20: "SAFE RIDER ACCESS" hardcodeado → clave t.common.riderLogin del
 *   diccionario bilingüe (no existe clave exacta "rider access"; reportado).
 * - M-1: bg-red-50 fuera de paleta → clase oficial .banner-emergency (globals.css).
 * - M-25: se honra el parámetro ?redirect= inyectado por el middleware de borde,
 *   con validación anti open-redirect (solo rutas internas relativas).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero jerga técnica visible al usuario.
 * - Integración con useLocale, useHaptic y diseño Incident.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";

/**
 * Valida que el destino de redirección sea una ruta interna segura.
 * Rechaza URLs absolutas y protocol-relative ("//malicioso.com") para
 * impedir open-redirects mediante el parámetro ?redirect= del middleware.
 */
function isSafeInternalPath(path: string | null): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

/**
 * Pantalla de login (envuelta en Suspense por useSearchParams, requisito
 * de prerenderizado estático de Next.js App Router).
 */
function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // M-25: destino solicitado por el middleware antes de expulsar al usuario
  const redirectParam = searchParams.get("redirect");
  const safeRedirect = isSafeInternalPath(redirectParam) ? redirectParam : null;

  // Comprobar si ya existe una sesión activa y redirigir
  useEffect(() => {
    let isMounted = true;
    async function checkExistingSession() {
      try {
        const session = await apiClient.getSession();
        if (isMounted && session.authenticated && session.user) {
          // Si el destino solicitado es /admin pero la sesión activa NO es ADMIN,
          // no redirigir a /admin para evitar el bucle infinito de rebote con el middleware.
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

      // Prioridad de destino: redirect propio del backend → ?redirect= del
      // middleware (M-25) → ruta por defecto según el rol de la cuenta.
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
    <div className="safe-mobile-container py-12 flex flex-col items-center justify-center min-h-[75vh]">
      <IncidentCard padding="lg" className="w-full max-w-md flex flex-col gap-6">
        {/* Cabecera Editorial */}
        <div className="flex flex-col gap-1 border-b border-ink pb-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-orange" />
            {/* C-20: eyebrow desde el diccionario bilingüe (cero texto en duro) */}
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-carbon">
              {t.common.riderLogin}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
            {t.login.title}
          </h1>
          <p className="font-sans text-micro text-carbon">
            {t.login.subtitle}
          </p>
        </div>

        {/* Formulario de Acceso */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.login.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              required
              autoComplete="email"
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.login.passwordLabel}
              </label>
              <Link
                href="/forgot-password"
                onClick={() => triggerHaptic("light")}
                className="font-sans text-micro text-carbon hover:text-signal-orange underline transition-colors"
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
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {/* M-1: error con la clase oficial .banner-emergency (bg-red-50 erradicado) */}
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
              {isLoading ? t.login.submittingButton : t.login.submitButton}
            </IncidentButton>
          </div>
        </form>

        {/* Enlaces de Ayuda y Activación */}
        <div className="pt-2 border-t border-mist flex flex-col items-center gap-2 text-micro font-sans text-center">
          {/* C-9: la activación exige escaneo físico real; la página principal
              contiene el formulario de folio verdadero (cero folios fabricados) */}
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] text-ink hover:text-signal-orange underline font-semibold"
          >
            {t.login.needHelpActivation}
          </Link>

          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] text-carbon hover:text-ink transition-colors"
          >
            ← {t.login.backToHome}
          </Link>
        </div>
      </IncidentCard>
    </div>
  );
}

/**
 * Página de inicio de sesión. Envuelve la pantalla en Suspense porque
 * useSearchParams exige un límite de suspense durante el prerenderizado.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="safe-mobile-container min-h-[75vh] flex items-center justify-center">
          <span className="w-4 h-4 rounded-full bg-signal-orange animate-ping" aria-hidden="true" />
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
