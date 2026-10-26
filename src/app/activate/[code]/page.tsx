/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 2: Activación y Registro de Kit Virgen
 * ARCHIVO: src/app/activate/[code]/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Onboarding del motociclista al recibir su kit físico: (1) PIN confidencial y
 * cuenta, (2) fotografía de rostro real, (3) ficha médica con catálogo sanguíneo
 * canónico (incluye DESCONOCIDO), (4) contactos con UUID y correo obligatorio,
 * y (5) consentimiento legal vinculante. Valida con el esquema REAL del backend
 * (ActivateDeviceSchema) y envía carga PLANA vía activate-api.ts.
 *
 * ENTRADAS: Param de ruta `code` (trim + mayúsculas, SIN fallback hardcodeado;
 *           vacío → error humano + regreso al inicio).
 * SALIDAS:  Pantalla de éxito con deviceCode real + redirect al panel (flujo
 *           2.3: redirección automática a los 2,5 s, con botón manual intacto).
 *
 * DEPENDENCIAS CLAVE: useActivateForm, BLOOD_TYPES (solo lectura),
 * CloudinaryPhotoPicker, ContactsRepeater, componentes Incident, useLocale,
 * useHaptic.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (objetivo < 380 en esta vista).
 * - Cero textos hardcodeados (100% `t`), cero mocks/fallbacks.
 * - Paleta Incident oficial; errores en banner crítico, nunca fondos rojos
 *   crudos. Táctiles ≥44px y háptica light/success/error.
 * ==============================================================================
 */

"use client";

import React, { use, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { BLOOD_TYPES } from "@/lib/schemas/common.schema";
import { CloudinaryPhotoPicker } from "@/components/medical/CloudinaryPhotoPicker";
import { ContactsRepeater } from "@/components/medical/ContactsRepeater";

import { useActivateForm } from "./activate-form";

/** Propiedades de la página: param de ruta dinámica de Next.js 15 (Promise). */
interface PageProps {
  params: Promise<{ code: string }>;
}

/** Campo de texto oficial SAFE 2026: lienzo blanco, foco suave y táctil ≥44px. */
const INPUT_CLASS =
  "safe-input-focus h-11 min-h-[44px] px-4 bg-brand-white border border-brand-border-field rounded-md font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted";

/** Microetiqueta oficial SAFE 2026. */
const LABEL_CLASS = "font-sans text-xs font-semibold text-brand-navy-dark";

/** Área de texto clínica SAFE 2026. */
const TEXTAREA_CLASS =
  "safe-input-focus p-3 bg-brand-white border border-brand-border-field rounded-md font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted resize-none";

export default function ActivatePage({ params }: PageProps) {
  const resolvedParams = use(params);
  // Folio real de la ruta: trim + mayúsculas y CERO fallback inventado.
  const code = (resolvedParams?.code ?? "").trim().toUpperCase();

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPin = searchParams?.get("pin") || "";
  const { locale, t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const form = useActivateForm(code, locale, urlPin);

  // Resultado real de la activación. Flujo 2.3: entrada directa al panel ya
  // logueado con redirección automática a los 2,5 s (timer limpiado al
  // desmontar); el botón manual de la pantalla de éxito se conserva intacto.
  const successResult = form.successResult;
  useEffect(() => {
    if (!successResult) return;
    const timer = setTimeout(() => router.push(successResult.redirect), 2500);
    return () => clearTimeout(timer);
  }, [successResult, router]);

  /** Envío con compuerta de consentimiento, háptica y activación real. */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // El consentimiento legal es obligatorio: sin casilla marcada no hay envío.
    if (!form.termsAccepted) {
      triggerHaptic("error");
      form.setErrorMessage(`${t.common.requiredField}: ${t.common.termsLink}`);
      return;
    }

    triggerHaptic("light");
    const activated = await form.submit();
    triggerHaptic(activated ? "success" : "error");
  };

  // Folio ausente o ilegible en la ruta: error humano y regreso al inicio.
  if (code.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col gap-5 text-center animate-fadeInUp">
        <div className="p-4 bg-rose-50 border border-brand-accent/30 rounded-xl text-xs text-brand-accent font-sans">
          ⚠️ {t.common.errorGeneric}
        </div>
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

  // Pantalla de confirmación con el folio REAL devuelto por el servicio.
  if (successResult) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col items-center justify-center text-center animate-fadeInUp">
        <div className="w-full bg-brand-white border border-brand-border-subtle rounded-2xl p-7 sm:p-9 shadow-lg flex flex-col items-center gap-5">
          <div
            aria-hidden="true"
            className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl shadow-sm"
          >
            🛡️
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy-dark leading-tight">
            {t.activate.successTitle}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-text-desc leading-relaxed">
            {t.activate.successMessage}
          </p>
          <div className="flex flex-col items-center gap-1.5 p-3 bg-brand-bg-alt border border-brand-border-subtle rounded-xl w-full">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
              {t.dashboard.folioLabel}
            </span>
            <span className="font-mono text-base font-bold uppercase tracking-widest text-brand-navy-dark">
              {successResult.deviceCode}
            </span>
          </div>
          <button
            type="button"
            className="w-full min-h-[48px] inline-flex items-center justify-center px-6 py-3.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer mt-2"
            onClick={() => router.push(successResult.redirect)}
          >
            {t.activate.goToDashboard}
          </button>
        </div>
      </div>
    );
  }

  // Mensaje visible: humano del backend/esquema o genérico del diccionario.
  const visibleError = form.errorMessage ?? (form.hasFailed ? t.common.errorGeneric : null);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 animate-fadeInUp">
      {/* Encabezado broadsheet con el folio real */}
      <section className="flex flex-col gap-2 border-b border-brand-separator pb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest bg-brand-navy-dark text-white px-3 py-1 rounded-md">
            {code}
          </span>
          <span className="font-sans text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
            {t.common.appName} · {t.nav.activateHelmet}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy-dark leading-tight">
          {t.activate.title}
        </h1>
        <p className="font-sans text-sm text-brand-text-desc">{t.activate.subtitle}</p>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Paso 1: PIN confidencial del kit y credenciales de la cuenta */}
        <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 hover:border-brand-border-strong transition-all">
          <div className="border-b border-brand-separator pb-3">
            <h3 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
              {t.activate.stepPinTitle}
            </h3>
            <p className="font-sans text-xs text-brand-text-desc mt-0.5">{t.activate.pinHelp}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-1">
                <label className={LABEL_CLASS}>{t.activate.pinLabel} *</label>
                {form.isPinAutoFilled && (
                  <span className="font-sans text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {t.activate.pinAutoAssignedBadge}
                  </span>
                )}
              </div>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                required
                value={form.pin}
                onChange={(event) => form.setPin(event.target.value.replace(/\D/g, ""))}
                placeholder={t.activate.pinPlaceholder}
                className="safe-input-focus h-12 px-3 bg-brand-white border border-brand-border-field rounded-md font-sans text-xl font-bold tracking-widest text-center text-brand-navy-dark"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>{t.activate.emailLabel} *</label>
              <input
                type="email" autoComplete="email" required className={INPUT_CLASS}
                value={form.email}
                onChange={(event) => form.setEmail(event.target.value)}
                placeholder={t.activate.emailPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>{t.activate.passwordLabel} *</label>
              <input
                type="password" autoComplete="new-password" required minLength={8}
                className={INPUT_CLASS}
                value={form.password}
                onChange={(event) => form.setPassword(event.target.value)}
                placeholder={t.activate.passwordPlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Paso 2: fotografía de rostro con subida real al servicio de medios */}
        <CloudinaryPhotoPicker
          currentPhotoUrl={form.photo.photoUrl}
          deviceCode={code}
          disabled={form.isSubmitting}
          onPhotoSelected={(photoUrl, meta) => {
            form.setPhoto({ photoUrl, photoPublicId: meta?.photoPublicId });
            form.setErrorMessage(null);
          }}
          onUploadError={(message) => {
            if (message) {
              form.setErrorMessage(message);
              triggerHaptic("warning");
            }
          }}
        />

        {/* Paso 3: ficha médica personal del conductor */}
        <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 hover:border-brand-border-strong transition-all">
          <div className="border-b border-brand-separator pb-3">
            <h3 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
              {t.dashboard.editMedicalTitle}
            </h3>
            <p className="font-sans text-xs text-brand-text-desc mt-0.5">{t.dashboard.editMedicalSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={LABEL_CLASS}>{t.activate.fullNameLabel} *</label>
              <input
                type="text" autoComplete="name" required className={INPUT_CLASS}
                value={form.fullName}
                onChange={(event) => form.setFullName(event.target.value)}
                placeholder={t.activate.fullNamePlaceholder}
              />
            </div>

            {/* Grupo sanguíneo: catálogo canónico del backend (única fuente) */}
            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>{t.activate.bloodTypeLabel} *</label>
              <select
                value={form.bloodType} required
                onChange={(event) => form.setBloodType(event.target.value)}
                className="safe-input-focus h-11 min-h-[44px] px-3 bg-brand-white border border-brand-border-field rounded-md font-serif text-base font-bold text-brand-navy-dark cursor-pointer"
              >
                <option value="" disabled>
                  {t.activate.bloodTypeLabel}
                </option>
                {BLOOD_TYPES.map((bloodTypeOption) => (
                  <option key={bloodTypeOption} value={bloodTypeOption}>
                    {bloodTypeOption}
                  </option>
                ))}
              </select>
              {form.bloodType === "OTRO" && (
                <input
                  type="text"
                  required
                  className={`${INPUT_CLASS} mt-1.5`}
                  value={form.customBloodType}
                  onChange={(event) => form.setCustomBloodType(event.target.value)}
                  placeholder={t.activate.customBloodTypePlaceholder}
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>{t.activate.nationalIdLabel} *</label>
              <input
                type="text" required className={INPUT_CLASS}
                value={form.nationalId}
                onChange={(event) => form.setNationalId(event.target.value)}
                placeholder={t.activate.nationalIdPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={LABEL_CLASS}>{t.activate.insuranceLabel}</label>
              <input
                type="text" className={INPUT_CLASS}
                value={form.insuranceInfo}
                onChange={(event) => form.setInsuranceInfo(event.target.value)}
                placeholder={t.activate.insurancePlaceholder}
              />
            </div>
          </div>

          <div className="border-t border-brand-separator my-1" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs font-semibold text-brand-accent">
                {t.activate.allergiesLabel}
              </label>
              <textarea
                rows={3} className={TEXTAREA_CLASS}
                value={form.allergies}
                onChange={(event) => form.setAllergies(event.target.value)}
                placeholder={t.activate.allergiesPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>{t.activate.conditionsLabel}</label>
              <textarea
                rows={3} className={TEXTAREA_CLASS}
                value={form.chronicConditions}
                onChange={(event) => form.setChronicConditions(event.target.value)}
                placeholder={t.activate.conditionsPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>{t.activate.medicationsLabel}</label>
              <textarea
                rows={3} className={TEXTAREA_CLASS}
                value={form.medications}
                onChange={(event) => form.setMedications(event.target.value)}
                placeholder={t.activate.medicationsPlaceholder}
              />
            </div>
          </div>
        </div>

        {/* Paso 4: repetidor de contactos con UUID y correo obligatorio */}
        <ContactsRepeater
          contacts={form.contacts}
          onChange={form.setContacts}
          disabled={form.isSubmitting}
          requireEmail
        />

        {/* Paso 5: consentimiento legal vinculante (safe-legal-and-terms) */}
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

        {/* Aviso de error accesible */}
        {visibleError && (
          <div className="text-xs rounded-md p-3.5 bg-red-50 text-red-700 border border-red-200 block animate-fadeInDown">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{visibleError}</span>
            </div>
          </div>
        )}

        {/* Botón de envío con estado de progreso */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={form.isSubmitting}
            className="w-full min-h-[48px] inline-flex items-center justify-center px-6 py-3.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-sm font-semibold rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {form.isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t.activate.submittingButton}
              </span>
            ) : (
              t.activate.submitButton
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
