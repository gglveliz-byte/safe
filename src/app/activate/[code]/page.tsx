/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 2: Registro de Cuenta de Piloto (SAFE 2026)
 * ARCHIVO: src/app/activate/[code]/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pantalla inicial de onboarding tras escanear un chip físico NFC o código QR:
 * (1) Muestra el folio de kit asignado (ej. SAFE-0001),
 * (2) Registra la cuenta del motociclista: nombre completo, correo, celular,
 *     país de residencia y contraseña segura con confirmación,
 * (3) Consentimiento obligatorio de Términos y Tratamiento de Datos,
 * (4) Al completar, muestra la confirmación de registro y transiciona al inicio
 *     de sesión (/login) para continuar con la vinculación del PIN y ficha médica.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 250 líneas).
 * - Cero textos hardcodeados (100% diccionario vía useLocale).
 * - Paleta Incident oficial; táctiles ≥44px y háptica.
 * ==============================================================================
 */

"use client";

import React, { use, useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { IncidentAlertBanner } from "@/components/ui/IncidentAlertBanner";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";

import { useActivateForm } from "./activate-form";
import { PendingActivationSection } from "./PendingActivationSection";

interface PageProps {
  params: Promise<{ code: string }>;
}

const INPUT_CLASS =
  "safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted";
const LABEL_CLASS = "font-sans text-xs font-semibold text-brand-navy-dark";

function ActivatePageContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const code = (resolvedParams?.code ?? "").trim().toUpperCase();

  const router = useRouter();
  const { locale, t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const form = useActivateForm(code, locale, t);

  const errorRef = useRef<HTMLDivElement | null>(null);
  const successResult = form.successResult;

  // Estado para detectar si el usuario ya se registró y vuelve a la pantalla para ingresar su PIN
  const [existingPending, setExistingPending] = useState<{
    fullName: string;
    email: string;
    riderPhone?: string;
    isPinDispatchMode?: boolean;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getDashboard()
      .then((data) => {
        if (!isMounted) return;
        // Si el usuario ya tiene sesión y este dispositivo está reservado sin activar (UNCLAIMED)
        if (data.device && data.device.status === "UNCLAIMED") {
          setExistingPending({
            fullName: data.profile?.fullName || data.user.email,
            email: data.user.email,
            riderPhone: data.profile?.emergencyNumber || data.profile?.riderPhone || "",
            isPinDispatchMode: Boolean(data.isPinDispatchMode),
          });
        }
      })
      .catch(() => {
        // Sin sesión activa o visitante nuevo; continúa en formulario de registro
      });
    return () => {
      isMounted = false;
    };
  }, [code]);

  useEffect(() => {
    if (form.errorMessage && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [form.errorMessage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    triggerHaptic("light");
    const registered = await form.submit();
    triggerHaptic(registered ? "success" : "error");
  };

  if (code.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col gap-5 text-center animate-fadeInUp">
        <IncidentAlertBanner type="warning" message={t.common.errorGeneric} />
        <button
          type="button"
          className="w-full min-h-[44px] inline-flex items-center justify-center px-4 py-2.5 bg-brand-navy-dark text-white rounded-lg text-sm font-semibold hover:bg-brand-navy-secondary transition-all cursor-pointer"
          onClick={() => router.push("/")}
        >
          {t.common.backToHome}
        </button>
      </div>
    );
  }

  // Usuario recién registrado o usuario autenticado pendiente de activar su PIN
  const activePending = successResult
    ? {
        fullName: successResult.fullName,
        email: successResult.email,
        riderPhone: successResult.riderPhone,
        isPinDispatchMode: true,
      }
    : existingPending;

  if (activePending) {
    return (
      <PendingActivationSection
        deviceCode={code}
        fullName={activePending.fullName}
        email={activePending.email}
        riderPhone={activePending.riderPhone}
        isPinDispatchMode={activePending.isPinDispatchMode}
        onActivated={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 min-h-[100dvh] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] flex flex-col gap-8 animate-fadeInUp">
      {/* Encabezado Broadsheet */}
      <section className="flex flex-col gap-2 border-b border-brand-separator pb-5">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="sm" />
          <span className="font-sans text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
            {t.common.appName} · {t.activate.registerTitle}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy-dark leading-tight">
          {t.activate.registerTitle}
        </h1>
        <p className="font-sans text-sm text-brand-text-desc">{t.activate.registerSubtitle}</p>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 hover:border-brand-border-strong transition-all">
          {/* Nombre Completo */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>{t.activate.fullNameLabel} *</label>
            <input
              type="text"
              required
              disabled={form.isSubmitting}
              value={form.fullName}
              onChange={(e) => form.setFullName(e.target.value)}
              placeholder={t.activate.fullNamePlaceholder}
              className={INPUT_CLASS}
            />
          </div>

          {/* Correo y Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>{t.activate.emailLabel} *</label>
              <input
                type="email"
                inputMode="email"
                required
                disabled={form.isSubmitting}
                value={form.email}
                onChange={(e) => form.setEmail(e.target.value)}
                placeholder={t.activate.emailPlaceholder}
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>{t.activate.riderPhoneLabel} *</label>
              <PhoneInputWithCountry
                value={form.riderPhone}
                onChange={form.setRiderPhone}
                disabled={form.isSubmitting}
                required
                placeholder={t.activate.riderPhonePlaceholder}
              />
            </div>
          </div>

          {/* Contraseña y Confirmar Contraseña */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>{t.activate.passwordLabel} *</label>
              <input
                type="password"
                required
                disabled={form.isSubmitting}
                value={form.password}
                onChange={(e) => form.setPassword(e.target.value)}
                placeholder={t.activate.passwordPlaceholder}
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>{t.activate.confirmPasswordLabel} *</label>
              <input
                type="password"
                required
                disabled={form.isSubmitting}
                value={form.confirmPassword}
                onChange={(e) => form.setConfirmPassword(e.target.value)}
                placeholder={t.activate.confirmPasswordPlaceholder}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        {/* Consentimiento legal vinculante */}
        <div className="p-4 bg-brand-white border border-brand-border-subtle rounded-xl shadow-xs">
          <label className="flex items-start gap-3 cursor-pointer select-none min-h-[44px]">
            <input
              type="checkbox"
              required
              checked={form.termsAccepted}
              onChange={(event) => form.setTermsAccepted(event.target.checked)}
              disabled={form.isSubmitting}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-brand-border-field text-brand-navy-dark focus:ring-brand-nav-blue cursor-pointer"
            />
            <span className="font-sans text-xs text-brand-text-desc leading-relaxed">
              {t.activate.acceptTermsPre}{" "}
              <Link
                href="/terms"
                target="_blank"
                className="underline font-semibold text-brand-navy-dark hover:text-brand-accent transition-colors"
              >
                {t.common.termsLink}
              </Link>{" "}
              {t.activate.acceptTermsMid}{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="underline font-semibold text-brand-navy-dark hover:text-brand-accent transition-colors"
              >
                {t.common.privacyLink}
              </Link>
              .
            </span>
          </label>
        </div>

        {/* Banner de error visible */}
        {form.errorMessage && (
          <div ref={errorRef}>
            <IncidentAlertBanner type="emergency" message={form.errorMessage} />
          </div>
        )}

        {/* Botón de envío */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={form.isSubmitting}
            className="w-full min-h-[48px] inline-flex items-center justify-center px-6 py-3.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {form.isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t.activate.registerSubmittingButton}
              </span>
            ) : (
              t.activate.registerSubmitButton
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ActivatePage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center">
          <span className="w-6 h-6 rounded-full border-2 border-brand-navy-dark border-t-transparent animate-spin" aria-hidden="true" />
        </div>
      }
    >
      <ActivatePageContent {...props} />
    </Suspense>
  );
}
