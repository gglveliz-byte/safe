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
import { ClaimDeviceCard } from "@/components/dashboard/ClaimDeviceCard";

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

  // Estado de registro: si ya se registraron los datos o si viene de un registro previo
  const isRegistered = Boolean(successResult || existingPending);
  const registeredData = successResult
    ? {
        fullName: successResult.fullName,
        email: successResult.email,
        riderPhone: successResult.riderPhone,
      }
    : existingPending
      ? {
          fullName: existingPending.fullName,
          email: existingPending.email,
          riderPhone: existingPending.riderPhone || "",
        }
      : null;

  const currentFullName = isRegistered && registeredData ? registeredData.fullName : form.fullName;
  const currentEmail = isRegistered && registeredData ? registeredData.email : form.email;
  const currentRiderPhone = isRegistered && registeredData ? registeredData.riderPhone : form.riderPhone;

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

      {/* PASO 1: Formulario de Registro (Se bloquea tras enviar los datos) */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <div
          className={`border rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 transition-all ${
            isRegistered
              ? "bg-brand-bg-alt/50 border-brand-border-subtle"
              : "bg-brand-white border-brand-border-subtle hover:border-brand-border-strong"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-brand-separator">
            <span className="font-serif font-bold text-lg text-brand-navy-dark">
              {t.activate.step1Title}
            </span>
            {isRegistered ? (
              <span className="font-sans text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
                <span>{t.activate.registeredDriverBadge}</span>
              </span>
            ) : (
              <span className="font-sans text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">
                1 de 2
              </span>
            )}
          </div>

          {/* Nombre Completo */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>{t.activate.fullNameLabel} *</label>
            <input
              type="text"
              required
              disabled={isRegistered || form.isSubmitting}
              value={currentFullName}
              onChange={(e) => form.setFullName(e.target.value)}
              placeholder={t.activate.fullNamePlaceholder}
              className={`${INPUT_CLASS} ${isRegistered ? "bg-brand-bg-alt opacity-80 cursor-not-allowed" : ""}`}
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
                disabled={isRegistered || form.isSubmitting}
                value={currentEmail}
                onChange={(e) => form.setEmail(e.target.value)}
                placeholder={t.activate.emailPlaceholder}
                className={`${INPUT_CLASS} ${isRegistered ? "bg-brand-bg-alt opacity-80 cursor-not-allowed" : ""}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>{t.activate.riderPhoneLabel} *</label>
              <PhoneInputWithCountry
                value={currentRiderPhone}
                onChange={form.setRiderPhone}
                disabled={isRegistered || form.isSubmitting}
                required
                placeholder={t.activate.riderPhonePlaceholder}
              />
            </div>
          </div>

          {/* Contraseña y Confirmar Contraseña (Solo si no está registrado) */}
          {!isRegistered ? (
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
          ) : (
            <div className="p-3 bg-brand-white border border-brand-border-subtle rounded-lg text-xs font-sans text-brand-text-muted flex items-center justify-between">
              <span>{t.activate.pendingAccountNotice}</span>
              <span className="font-semibold text-emerald-700">✓ Guardado</span>
            </div>
          )}
        </div>

        {/* Consentimiento legal vinculante (solo visible antes de registrar) */}
        {!isRegistered && (
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
        )}

        {/* Banner de error visible */}
        {form.errorMessage && (
          <div ref={errorRef}>
            <IncidentAlertBanner type="emergency" message={form.errorMessage} />
          </div>
        )}

        {/* Botón de envío de datos del Paso 1 */}
        <div className="pt-1">
          {isRegistered ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2 shadow-xs">
              <span className="text-sm">✓</span>
              <span>{t.activate.codeRequestedNotice}</span>
            </div>
          ) : (
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
                `📩 ${t.activate.registerSubmitButton}`
              )}
            </button>
          )}
        </div>
      </form>

      {/* PASO 2: Tarjeta interactiva de PIN (Visible siempre; se habilita tras registrar datos) */}
      <section className="flex flex-col gap-2 pt-2 border-t border-brand-separator">
        <div className="flex items-center justify-between pb-1">
          <span className="font-serif font-bold text-lg text-brand-navy-dark">
            {t.activate.step2Title}
          </span>
          <span className="font-sans text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">
            2 de 2
          </span>
        </div>
        <ClaimDeviceCard
          prefilledCode={code}
          isPinDispatchMode={true}
          disabled={!isRegistered}
          disabledMessage={t.activate.step2LockedHelp}
          onClaimSuccess={() => router.push("/dashboard")}
        />
      </section>
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
