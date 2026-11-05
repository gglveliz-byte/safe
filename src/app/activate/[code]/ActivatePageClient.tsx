/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 2: Activación Unificada de Kit (SAFE 2026)
 * ARCHIVO: src/app/activate/[code]/ActivatePageClient.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente cliente para el alta y activación de kit físico.
 * La modalidad se determina de forma 100% AUTOMÁTICA por el servidor:
 *
 * 1. MODO NORMAL (isAssistedMode = false o QR con PIN):
 *    El piloto tiene su PIN impreso en la tarjeta/sticker o prellenado por QR.
 *    El campo de PIN está listo para ingresar desde el inicio.
 *    Un solo botón: "⚡ Registrar y Activar Kit" (1 clic -> Dashboard).
 *
 * 2. MODO ASISTIDO (isAssistedMode = true):
 *    El sticker fue generado sin PIN visible para entrega por asesor.
 *    El formulario solicita los datos básicos con botón "Solicitar Código de Activación".
 *    Al registrarse, el sistema despacha el PIN al admin por correo con botón WhatsApp.
 *    Los datos personales se bloquean ("no vale cambiar"), el campo de PIN se habilita
 *    y el botón cambia a "Activar Cuenta" esperando el código del asesor.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero preguntas o conmutadores manuales en la UI: detección 100% servidor.
 * - Paleta Incident oficial, táctiles ≥44px y respuesta háptica.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { IncidentAlertBanner } from "@/components/ui/IncidentAlertBanner";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";
import { useActivateForm } from "./activate-form";

export interface ActivatePageClientProps {
  code: string;
  isAssistedMode: boolean;
  initialPin?: string;
}

const INPUT_CLASS =
  "safe-input-focus h-11 min-h-[44px] px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted transition-colors";
const LABEL_CLASS = "font-sans text-xs font-semibold text-brand-navy-dark";

export function ActivatePageClient({
  code,
  isAssistedMode,
  initialPin = "",
}: ActivatePageClientProps) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const form = useActivateForm(code, locale, t);

  const [pin, setPin] = useState(initialPin);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const pinInputRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Si el QR ya incluía el PIN (?pin=...), se desactiva el modo asistido y se activa directo
  const effectiveAssistedMode = initialPin.length === 6 ? false : isAssistedMode;

  // Detección de cuenta ya registrada previamente en espera de PIN
  const [existingPending, setExistingPending] = useState<{
    fullName: string;
    email: string;
    riderPhone?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getSession()
      .then((session) => {
        if (!isMounted || !session.authenticated) return;
        return apiClient.getDashboard().then((data) => {
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
        });
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

  // Auto-foco en el input de PIN al quedar registrado o en modo normal
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

    const cleanPin = pin.trim();

    // =========================================================================
    // FLUJO 1: MODALIDAD NORMAL (Con PIN en mano / QR)
    // =========================================================================
    if (!effectiveAssistedMode && !isRegistered) {
      if (cleanPin.length !== 6) {
        setPinError(t.activate.errorPinInvalid);
        triggerHaptic("warning");
        pinInputRef.current?.focus();
        return;
      }

      triggerHaptic("light");
      const ok = await form.submit();
      if (!ok) {
        triggerHaptic("error");
        return;
      }

      // Registro exitoso -> vincular PIN inmediatamente
      setIsPinSubmitting(true);
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
        return;
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
      return;
    }

    // =========================================================================
    // FLUJO 2: MODALIDAD ASISTIDA (Paso 1: Solicitar código al asesor)
    // =========================================================================
    if (effectiveAssistedMode && !isRegistered) {
      triggerHaptic("light");
      const ok = await form.submit();
      if (ok) {
        triggerHaptic("success");
      } else {
        triggerHaptic("error");
      }
      return;
    }

    // =========================================================================
    // PASO 2 POST-REGISTRO: Activar cuenta con PIN recibido del asesor
    // =========================================================================
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

      {/* Formulario Unificado guiado por el Servidor */}
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

          {/* Contraseñas (Bloqueadas y enmascaradas tras enviar) */}
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

          {/* Apartado de Activación: Determinado 100% por el servidor */}
          <div className="border-t border-brand-separator pt-5 flex flex-col gap-3">
            <label className="font-serif font-bold text-sm text-brand-navy-dark text-center">
              {t.activate.pinSectionTitle} *
            </label>

            {/* Aviso sutil si el PIN provino del QR escaneado */}
            {initialPin && (
              <div className="inline-flex items-center justify-center gap-1.5 py-1 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold text-center">
                <span>⚡</span>
                <span>{t.activate.pinAutoDetectedBadge}</span>
              </div>
            )}

            {/* Modo Normal O Modo Asistido Post-Registro: Input de PIN visible y activo */}
            {(!effectiveAssistedMode || isRegistered) && (
              <div className="flex flex-col items-center gap-2">
                <input
                  ref={pinInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  disabled={form.isSubmitting || isPinSubmitting}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="1 2 3 4 5 6"
                  className="w-full max-w-xs mx-auto h-12 text-center font-mono text-2xl font-bold tracking-[0.4em] rounded-lg border-2 border-brand-navy-dark text-brand-navy-dark focus:border-brand-accent shadow-xs bg-brand-white transition-all"
                />
                <p className="font-sans text-xs text-brand-text-muted text-center px-4">
                  {isRegistered
                    ? t.activate.waitingAdvisorPinNotice
                    : t.activate.pinNoticeHasPin}
                </p>
              </div>
            )}

            {/* Modo Asistido Pre-Registro: Explicación limpia de solicitud al asesor */}
            {effectiveAssistedMode && !isRegistered && (
              <div className="p-3 bg-brand-nav-active border border-brand-nav-blue/20 rounded-lg text-center">
                <p className="font-sans text-xs text-brand-navy-dark leading-relaxed">
                  {t.activate.pinNoticeNeedsPin}
                </p>
              </div>
            )}
          </div>

          {/* Alerta de error si ocurre alguno */}
          {activeErrorMessage && (
            <div ref={errorRef} className="pt-2">
              <IncidentAlertBanner type="emergency" message={activeErrorMessage} />
            </div>
          )}

          {/* BOTÓN INTELIGENTE */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={form.isSubmitting || isPinSubmitting}
              className="w-full min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {form.isSubmitting || isPinSubmitting ? (
                <span>
                  {!effectiveAssistedMode
                    ? t.activate.registerAndActivateSubmittingButton
                    : isRegistered
                    ? t.activate.activatingAccountButton
                    : t.activate.registerSubmittingButton}
                </span>
              ) : isRegistered ? (
                <span>{t.activate.activateAccountButton}</span>
              ) : !effectiveAssistedMode ? (
                <span>{t.activate.registerAndActivateDirectButton}</span>
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

