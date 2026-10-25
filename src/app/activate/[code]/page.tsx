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
import { useRouter } from "next/navigation";

import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { BLOOD_TYPES } from "@/lib/schemas/common.schema";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { IncidentAlertBanner } from "@/components/ui/IncidentAlertBanner";
import { IncidentHairline } from "@/components/ui/IncidentHairline";
import { CloudinaryPhotoPicker } from "@/components/medical/CloudinaryPhotoPicker";
import { ContactsRepeater } from "@/components/medical/ContactsRepeater";

import { useActivateForm } from "./activate-form";

/** Propiedades de la página: param de ruta dinámica de Next.js 15 (Promise). */
interface PageProps {
  params: Promise<{ code: string }>;
}

/** Campo de texto canónico Incident: hormigón, borde capilar y táctil ≥44px. */
const INPUT_CLASS =
  "h-11 min-h-[44px] px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink";

/** Microetiqueta canónica Arial 13px en versalitas. */
const LABEL_CLASS = "font-sans text-micro font-bold uppercase text-carbon";

/** Área de texto clínica canónica (alergias, padecimientos, medicamentos). */
const TEXTAREA_CLASS =
  "p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none";

export default function ActivatePage({ params }: PageProps) {
  const resolvedParams = use(params);
  // Folio real de la ruta: trim + mayúsculas y CERO fallback inventado.
  const code = (resolvedParams?.code ?? "").trim().toUpperCase();

  const router = useRouter();
  const { locale, t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const form = useActivateForm(code, locale);

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
      <div className="safe-mobile-container py-12 flex flex-col gap-6">
        <IncidentAlertBanner type="emergency" message={t.common.errorGeneric} />
        <IncidentButton type="button" variant="neutral" className="w-full sm:w-auto" onClick={() => router.push("/")}>
          {t.common.backToHome}
        </IncidentButton>
      </div>
    );
  }

  // Pantalla de confirmación con el folio REAL devuelto por el servicio.
  if (successResult) {
    return (
      <div className="safe-mobile-container py-12 flex flex-col items-center justify-center text-center">
        <IncidentCard padding="lg" className="max-w-md w-full flex flex-col items-center gap-4">
          {/* Escudo Incident decorativo sobre hormigón con borde estructural */}
          <div aria-hidden="true" className="w-16 h-16 rounded-[12px] bg-concrete border-2 border-ink flex items-center justify-center text-heading-sm">
            🛡️
          </div>
          <h2 className="font-serif text-heading-sm font-bold text-ink">
            {t.activate.successTitle}
          </h2>
          <p className="font-serif text-body text-carbon">{t.activate.successMessage}</p>
          <div className="flex flex-col items-center gap-1">
            <span className="font-sans text-micro uppercase text-carbon">
              {t.dashboard.folioLabel}
            </span>
            <span className="font-sans text-micro font-bold uppercase tracking-widest bg-concrete px-3 py-1 border border-ink rounded-[4px]">
              {successResult.deviceCode}
            </span>
          </div>
          <IncidentButton type="button" variant="emergency" size="lg" className="w-full mt-2" onClick={() => router.push(successResult.redirect)}>
            {t.activate.goToDashboard}
          </IncidentButton>
        </IncidentCard>
      </div>
    );
  }

  // Mensaje visible: humano del backend/esquema o genérico del diccionario.
  const visibleError = form.errorMessage ?? (form.hasFailed ? t.common.errorGeneric : null);

  return (
    <div className="safe-mobile-container py-8 sm:py-12 flex flex-col gap-8">
      {/* Encabezado broadsheet con el folio real. El estado del kit NO se
          afirma aquí (hallazgo #11): la verdad la dicta el backend al enviar. */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-sans text-micro font-bold uppercase tracking-widest bg-ink text-paper px-2 py-0.5 rounded-[4px]">
            {code}
          </span>
        </div>
        <h1 className="font-serif text-heading-sm sm:text-heading font-bold text-ink leading-tight">
          {t.activate.title}
        </h1>
        <p className="font-serif text-body text-carbon">{t.activate.subtitle}</p>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Paso 1: PIN confidencial del kit y credenciales de la cuenta */}
        <IncidentCard padding="md" className="flex flex-col gap-4">
          <div className="border-b border-mist pb-2">
            <h3 className="font-serif font-bold text-heading-sm text-ink">
              {t.activate.stepPinTitle}
            </h3>
            <p className="font-sans text-micro text-carbon mt-0.5">{t.activate.pinHelp}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className={LABEL_CLASS}>{t.activate.pinLabel} *</label>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                required
                value={form.pin}
                onChange={(event) => form.setPin(event.target.value.replace(/\D/g, ""))}
                placeholder={t.activate.pinPlaceholder}
                className="h-12 px-3 bg-concrete border-2 border-ink rounded-[4px] font-sans text-heading-sm font-bold tracking-widest text-center text-ink focus:outline-none focus:ring-1 focus:ring-ink"
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
        </IncidentCard>

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
        <IncidentCard padding="md" className="flex flex-col gap-4">
          <div className="border-b border-mist pb-2">
            {/* Semántica de onboarding (hallazgo #12): claves del panel médico,
                NO del contexto de siniestro (t.emergency.*) */}
            <h3 className="font-serif font-bold text-heading-sm text-ink">
              {t.dashboard.editMedicalTitle}
            </h3>
            <p className="font-sans text-micro text-carbon mt-0.5">{t.dashboard.editMedicalSubtitle}</p>
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
                className="h-11 min-h-[44px] px-3 bg-concrete border-2 border-ink rounded-[4px] font-serif text-body font-bold text-ink focus:outline-none cursor-pointer"
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

          <IncidentHairline variant="subtle" margin="sm" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-alert-red">
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
        </IncidentCard>

        {/* Paso 4: repetidor de contactos con UUID y correo obligatorio */}
        <ContactsRepeater
          contacts={form.contacts}
          onChange={form.setContacts}
          disabled={form.isSubmitting}
          requireEmail
        />

        {/* Paso 5: consentimiento legal vinculante (safe-legal-and-terms) */}
        <div className="p-4 bg-paper border border-ink rounded-[8px]">
          <label className="flex items-start gap-3 cursor-pointer select-none min-h-[44px]">
            <input
              type="checkbox"
              required
              checked={form.termsAccepted}
              onChange={(event) => form.setTermsAccepted(event.target.checked)}
              disabled={form.isSubmitting}
              className="mt-0.5 h-6 w-6 shrink-0 accent-ink cursor-pointer"
            />
            <span className="font-sans text-micro text-ink leading-relaxed">
              {t.activate.acceptTermsPre}{" "}
              <Link
                href="/terms"
                target="_blank"
                className="underline font-bold text-ink hover:text-signal-orange"
              >
                {t.common.termsLink}
              </Link>{" "}
              {t.activate.acceptTermsMid}{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="underline font-bold text-ink hover:text-signal-orange"
              >
                {t.common.privacyLink}
              </Link>
              .
            </span>
          </label>
        </div>

        {/* Aviso de error en banner crítico Incident (nunca fondos crudos) */}
        {visibleError && <IncidentAlertBanner type="emergency" message={visibleError} />}

        {/* Botón de envío con estado de progreso */}
        <div className="pt-2">
          <IncidentButton
            type="submit" variant="emergency" size="lg" className="w-full"
            isLoading={form.isSubmitting} disabled={form.isSubmitting}
          >
            {form.isSubmitting ? t.activate.submittingButton : t.activate.submitButton}
          </IncidentButton>
        </div>
      </form>
    </div>
  );
}
