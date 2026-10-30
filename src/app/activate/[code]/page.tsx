/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 2: Activación Unificada de Kit (SAFE 2026)
 * ARCHIVO: src/app/activate/[code]/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pantalla directa y unificada de registro y activación de kit físico:
 * (1) Tarjeta única con los datos del motociclista y el campo del PIN de activación.
 * (2) Un solo botón de acción:
 *     - Inicial: "Solicitar Código de Activación" (registra la cuenta y envía el PIN al admin).
 *     - Tras registrar: Los campos se oscurecen y bloquean ("no vale cambiar").
 *     - El campo del PIN se habilita y el mismo botón cambia a "Activar Cuenta".
 * (3) Al ingresar el PIN de 6 dígitos y presionar "Activar Cuenta", vincula el kit
 *     y redirige directamente al panel (/dashboard).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 250 líneas).
 * - Cero textos hardcodeados (100% diccionario bilingüe vía useLocale).
 * - Paleta Incident oficial, táctiles ≥44px y respuesta háptica.
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

interface PageProps {
  params: Promise<{ code: string }>;
}

const INPUT_CLASS =
  "safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted transition-colors";
const LABEL_CLASS = "font-sans text-xs font-semibold text-brand-navy-dark";

function ActivatePageContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const code = (resolvedParams?.code ?? "").trim().toUpperCase();

  const router = useRouter();
  const { locale, t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const form = useActivateForm(code, locale, t);

  const [pin, setPin] = useState("");
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const pinInputRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Detección de cuenta ya registrada previamente en espera de PIN
  const [existingPending, setExistingPending] = useState<{
    fullName: string;
    email: string;
    riderPhone?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getDashboard()
      .then((data) => {
        if (!isMounted) return;
        if (data.device?.status === "ACTIVE") {
          router.push("/dashboard");
          return;
        }
        if (data.device && data.device.status === "UNCLAIMED") {
          setExistingPending({
            fullName: data.profile?.fullName || data.user.email,
            email: data.user.email,
            riderPhone: data.profile?.emergencyNumber || data.profile?.riderPhone || "",
          });
        }
      })
      .catch(() => {
        // Visitante nuevo sin sesión
      });
    return () => {
      isMounted = false;
    };
  }, [code, router]);

  const isRegistered = Boolean(form.successResult || existingPending);

  const registeredData = form.successResult
    ? {
        fullName: form.successResult.fullName,
        email: form.successResult.email,
        riderPhone: form.successResult.riderPhone,
      }
    : existingPending;

  const currentFullName = isRegistered && registeredData ? registeredData.fullName : form.fullName;
  const currentEmail = isRegistered && registeredData ? registeredData.email : form.email;
  const currentRiderPhone = isRegistered && registeredData ? registeredData.riderPhone : form.riderPhone;

  // Auto-foco en el input de PIN una vez que se completa el registro
  useEffect(() => {
    if (isRegistered && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [isRegistered]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(cleanDigits);
    if (pinError) setPinError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPinError(null);

    // Estado 1: Solicitar código de activación (Registro)
    if (!isRegistered) {
      triggerHaptic("light");
      const ok = await form.submit();
      if (ok) {
        triggerHaptic("success");
      } else {
        triggerHaptic("error");
      }
      return;
    }

    // Estado 2: Activar cuenta con el PIN de 6 dígitos
    const cleanPin = pin.trim();
    if (cleanPin.length !== 6) {
      setPinError(t.activate.errorPinInvalid);
      triggerHaptic("warning");
      pinInputRef.current?.focus();
      return;
    }

    setIsPinSubmitting(true);
    triggerHaptic("light");
    try {
      const res = await apiClient.claimDevice({
        code,
        pin: cleanPin,
      });

      if (!res.success) {
        throw new Error(res.message || t.activate.errorPinInvalid);
      }

      triggerHaptic("success");
      router.push("/dashboard");
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : t.activate.errorPinInvalid;
      setPinError(msg);
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } finally {
      setIsPinSubmitting(false);
    }
  };

  const activeErrorMessage = pinError || form.errorMessage;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 sm:py-12 min-h-[100dvh] flex flex-col gap-6 animate-fadeInUp">
      {/* Cabecera limpia y directa */}
      <section className="flex flex-col gap-2 border-b border-brand-separator pb-4">
        <div className="flex items-center justify-between">
          <BrandLogo size="sm" />
          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-brand-bg-alt border border-brand-border-subtle rounded-md text-brand-navy-dark">
            Folio: {code}
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy-dark">
          {t.activate.registerTitle}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-brand-text-desc">
          {t.activate.registerSubtitle}
        </p>
      </section>

      {/* Tarjeta Única con Formulario y PIN Integrado */}
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-5" noValidate>
        <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-7 shadow-xs flex flex-col gap-4">
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
              className={`${INPUT_CLASS} ${isRegistered ? "bg-brand-bg-alt/70 opacity-60 cursor-not-allowed select-none" : ""}`}
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
                className={`${INPUT_CLASS} ${isRegistered ? "bg-brand-bg-alt/70 opacity-60 cursor-not-allowed select-none" : ""}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>{t.activate.riderPhoneLabel} *</label>
              <PhoneInputWithCountry
                value={currentRiderPhone || ""}
                onChange={form.setRiderPhone}
                disabled={isRegistered || form.isSubmitting}
                required
                placeholder={t.activate.riderPhonePlaceholder}
              />
            </div>
          </div>

          {/* Contraseñas (Se oscurecen y bloquean tras enviar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>{t.activate.passwordLabel} *</label>
              <input
                type="password"
                required
                disabled={isRegistered || form.isSubmitting}
                value={isRegistered ? "••••••••" : form.password}
                onChange={(e) => form.setPassword(e.target.value)}
                placeholder={t.activate.passwordPlaceholder}
                className={`${INPUT_CLASS} ${isRegistered ? "bg-brand-bg-alt/70 opacity-60 cursor-not-allowed select-none" : ""}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>{t.activate.confirmPasswordLabel} *</label>
              <input
                type="password"
                required
                disabled={isRegistered || form.isSubmitting}
                value={isRegistered ? "••••••••" : form.confirmPassword}
                onChange={(e) => form.setConfirmPassword(e.target.value)}
                placeholder={t.activate.confirmPasswordPlaceholder}
                className={`${INPUT_CLASS} ${isRegistered ? "bg-brand-bg-alt/70 opacity-60 cursor-not-allowed select-none" : ""}`}
              />
            </div>
          </div>

          {/* Consentimiento legal */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              required
              checked={isRegistered ? true : form.termsAccepted}
              onChange={(e) => form.setTermsAccepted(e.target.checked)}
              disabled={isRegistered || form.isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-brand-border-field text-brand-navy-dark focus:ring-brand-nav-blue cursor-pointer"
            />
            <span className="font-sans text-xs text-brand-text-desc leading-snug">
              {t.activate.acceptTermsPre}{" "}
              <Link href="/terms" target="_blank" className="underline font-semibold text-brand-navy-dark">
                {t.common.termsLink}
              </Link>{" "}
              {t.activate.acceptTermsMid}{" "}
              <Link href="/privacy" target="_blank" className="underline font-semibold text-brand-navy-dark">
                {t.common.privacyLink}
              </Link>.
            </span>
          </label>

          {/* Apartado Único: Código de Activación */}
          <div className="border-t border-brand-separator pt-5 flex flex-col gap-2.5">
            <label className="font-serif font-bold text-sm text-brand-navy-dark text-center">
              {t.activate.pinSectionTitle} *
            </label>
            <input
              ref={pinInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              disabled={!isRegistered || isPinSubmitting}
              value={pin}
              onChange={handlePinChange}
              placeholder="1 2 3 4 5 6"
              className={`w-full max-w-xs mx-auto h-12 text-center font-mono text-2xl font-bold tracking-[0.4em] rounded-lg border transition-all ${
                isRegistered
                  ? "bg-brand-white border-2 border-brand-navy-dark text-brand-navy-dark focus:border-brand-accent shadow-xs"
                  : "bg-brand-bg-alt/70 border-brand-border-field text-brand-text-muted opacity-50 cursor-not-allowed"
              }`}
            />
            <p className="font-sans text-xs text-brand-text-muted text-center px-4">
              {t.activate.pinHelpNotice}
            </p>
          </div>

          {/* Alerta de error si ocurre alguno */}
          {activeErrorMessage && (
            <div ref={errorRef} className="pt-2">
              <IncidentAlertBanner type="emergency" message={activeErrorMessage} />
            </div>
          )}

          {/* UN SOLO BOTÓN DE ACCIÓN */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={form.isSubmitting || isPinSubmitting}
              className="w-full min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {form.isSubmitting ? (
                <span>{t.activate.registerSubmittingButton}</span>
              ) : isPinSubmitting ? (
                <span>{t.activate.activatingAccountButton}</span>
              ) : isRegistered ? (
                <span>{t.activate.activateAccountButton}</span>
              ) : (
                <span>{t.activate.registerSubmitButton}</span>
              )}
            </button>
          </div>
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
