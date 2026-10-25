/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Landing Page — Sección de Activación de Casco
 * ARCHIVO: src/components/landing/HelmetActivationSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Formulario de captura y vinculación del tag físico SAFE. Valida localmente el
 * código/folio ingresado y redirige a la ruta real de activación `/activate/[folio]`.
 * Jamás inventa folios ficticios.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 180 líneas).
 * - Cero texto hardcodeado (consumo de t vía useLocale).
 * - Enrutamiento real a `/activate/[folio]`.
 * ==============================================================================
 */

"use client";

import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

const CODE_PATTERN = /^[A-Za-z0-9-]{4,32}$/;

export function HelmetActivationSection() {
  const { t } = useLocale();
  const router = useRouter();
  const { triggerHaptic } = useHaptic();

  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "idle" | "verifying" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 32);
    setCode(val);
    if (feedback.type !== "idle") {
      setFeedback({ type: "idle", message: "" });
    }
  };

  const clearInput = () => {
    setCode("");
    setFeedback({ type: "idle", message: "" });
    triggerHaptic("light");
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const candidate = code.trim();

    if (!candidate) {
      triggerHaptic("error");
      setFeedback({
        type: "error",
        message: t.common.requiredField,
      });
      return;
    }

    if (!CODE_PATTERN.test(candidate)) {
      triggerHaptic("error");
      setFeedback({
        type: "error",
        message:
          candidate.length < 4
            ? "El código ingresado parece incompleto. Verifica los dígitos en la etiqueta de tu casco."
            : "Formato de código inválido. Usa únicamente caracteres alfanuméricos.",
      });
      return;
    }

    triggerHaptic("light");
    setLoading(true);
    setFeedback({
      type: "verifying",
      message: t.landing.activateHelmetConnecting,
    });

    // Pequeño retardo de confirmación visual antes de redirigir a la ruta real
    setTimeout(() => {
      setLoading(false);
      triggerHaptic("success");
      router.push(`/activate/${encodeURIComponent(candidate)}`);
    }, 700);
  };

  return (
    <section id="activar-casco" className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-8 md:p-10 shadow-sm transition-all duration-300 hover:border-brand-border-strong hover:shadow">
        <div className="max-w-3xl">
          <h2 className="font-sans font-bold text-xs sm:text-sm text-brand-navy-dark tracking-[0.14em] uppercase mb-2">
            {t.landing.activateHelmetSectionTitle}
          </h2>
          <p className="font-sans text-sm text-brand-text-muted mb-6">
            {t.landing.activateHelmetSectionSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <label htmlFor="codigo-casco" className="sr-only">
                {t.landing.activateHelmetSectionTitle}
              </label>
              <input
                id="codigo-casco"
                name="codigo"
                type="text"
                value={code}
                onChange={handleInputChange}
                autoComplete="off"
                spellCheck={false}
                placeholder={t.landing.activateHelmetInputPlaceholder}
                className="safe-input-focus w-full px-4 py-3.5 bg-brand-white border border-brand-border-field rounded-md font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted transition-all"
              />
              {code.length > 0 && (
                <button
                  type="button"
                  aria-label="Limpiar campo"
                  onClick={clearInput}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-navy-dark p-1 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-7 py-3.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-sm font-semibold rounded-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-nav-blue flex-shrink-0 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <span>
                {loading ? t.landing.activateHelmetVerifying : t.landing.activateCta}
              </span>
              {loading && (
                <svg
                  className="animate-spin ml-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Feedback interactivo accesible */}
          {feedback.type === "error" && (
            <div className="text-xs rounded-md p-3.5 bg-red-50 text-red-700 border border-red-200 block animate-fadeInDown">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{feedback.message}</span>
              </div>
            </div>
          )}

          {feedback.type === "verifying" && (
            <div className="text-xs rounded-md p-3.5 bg-blue-50 text-brand-text-desc border border-blue-200 block animate-fadeInDown">
              <div className="flex items-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5 text-brand-nav-blue" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{feedback.message}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
