/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 4: Inicio de Sesión del Motociclista
 * ARCHIVO: src/app/login/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pantalla de acceso privado para pilotos registrados. Permite ingresar
 * con correo y contraseña para editar la ficha médica, gestionar contactos
 * o activar el 'Modo Ruta' antes de salir a carretera.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero tecnicismos en pantalla.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    triggerHaptic("light");

    try {
      await apiClient.login({ email, password });
      triggerHaptic("success");
      router.push("/dashboard");
    } catch (err: any) {
      triggerHaptic("error");
      setErrorMessage(err?.message || t.login.errorInvalidCredentials);
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
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-carbon">
              SAFE RIDER ACCESS
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
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.login.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.login.passwordPlaceholder}
              required
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-alert-red rounded-[6px] text-micro text-alert-red font-sans text-center">
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
          <Link
            href="/activate/SAFE-0001"
            className="text-ink hover:text-signal-orange underline font-semibold"
          >
            {t.login.needHelpActivation}
          </Link>

          <Link
            href="/"
            className="text-carbon hover:text-ink transition-colors"
          >
            ← {t.login.backToHome}
          </Link>
        </div>
      </IncidentCard>
    </div>
  );
}
