/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 2: Activación y Registro de Kit Virgen
 * ARCHIVO: src/app/activate/[code]/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Orquestador principal del onboarding de activación de casco/pulsera SAFE:
 * (1) Validación de seguridad del chip físico y credenciales de acceso,
 * (2) Fotografía de rostro real en Cloudinary,
 * (3) Identificación del beneficiario, país de residencia, celular y edad,
 * (4) Ficha médica clínica, donación de órganos y hallazgos preexistentes,
 * (5) Notas de rescate, tutor, uso frecuente y datos vehiculares,
 * (6) Repetidor dinámico de contactos de emergencia con selector rápido,
 * (7) Consentimiento legal vinculante (Habeas Data / GDPR).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (arquitectura modular < 250 líneas).
 * - Cero textos hardcodeados (100% `t`).
 * - Paleta Incident oficial; táctiles ≥44px, scroll al primer error y háptica.
 * ==============================================================================
 */

"use client";

import React, { use, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { IncidentAlertBanner } from "@/components/ui/IncidentAlertBanner";
import { CloudinaryPhotoPicker } from "@/components/medical/CloudinaryPhotoPicker";
import { ContactsRepeater } from "@/components/medical/ContactsRepeater";

import { useActivateForm } from "./activate-form";
import { ActivatePinAccountSection } from "./ActivatePinAccountSection";
import { ActivateIdentitySection } from "./ActivateIdentitySection";
import { ActivateMedicalSection } from "./ActivateMedicalSection";
import { ActivateRescueNotesSection } from "./ActivateRescueNotesSection";
import { ActivateSuccessSection } from "./ActivateSuccessSection";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function ActivatePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const code = (resolvedParams?.code ?? "").trim().toUpperCase();

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPin = searchParams?.get("pin") || "";
  const { locale, t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const form = useActivateForm(code, locale, urlPin);

  const errorRef = useRef<HTMLDivElement | null>(null);
  const successResult = form.successResult;

  useEffect(() => {
    if (!successResult) return;
    const timer = setTimeout(() => router.push(successResult.redirect), 2500);
    return () => clearTimeout(timer);
  }, [successResult, router]);

  const visibleError = form.errorMessage ?? (form.hasFailed ? t.common.errorGeneric : null);

  // Ergonomía móvil (safe-mobile-native-feel): auto-scroll al error al fallar
  useEffect(() => {
    if (visibleError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [visibleError]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.termsAccepted) {
      triggerHaptic("error");
      form.setErrorMessage(`${t.common.requiredField}: ${t.common.termsLink}`);
      return;
    }

    triggerHaptic("light");
    const activated = await form.submit();
    triggerHaptic(activated ? "success" : "error");
  };

  if (code.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col gap-5 text-center animate-fadeInUp">
        <IncidentAlertBanner
          type="warning"
          message={t.common.errorGeneric}
        />
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

  if (successResult) {
    return (
      <ActivateSuccessSection
        deviceCode={successResult.deviceCode}
        redirect={successResult.redirect}
        onNavigate={(path) => router.push(path)}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 min-h-[100dvh] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] flex flex-col gap-8 animate-fadeInUp">
      {/* Encabezado broadsheet */}
      <section className="flex flex-col gap-2 border-b border-brand-separator pb-5">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="sm" />
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
        {/* Paso 1: PIN confidencial del kit, correo, contraseña y confirmación */}
        <ActivatePinAccountSection
          pin={form.pin}
          onPinChange={form.setPin}
          isPinAutoFilled={form.isPinAutoFilled}
          email={form.email}
          onEmailChange={form.setEmail}
          password={form.password}
          onPasswordChange={form.setPassword}
          confirmPassword={form.confirmPassword}
          onConfirmPasswordChange={form.setConfirmPassword}
          disabled={form.isSubmitting}
        />

        {/* Paso 2: fotografía de rostro con subida real al servicio Cloudinary */}
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

        {/* Paso 3: Identificación del Beneficiario, País, Celular y Ubicación */}
        <ActivateIdentitySection
          beneficiaryType={form.beneficiaryType}
          onBeneficiaryTypeChange={form.setBeneficiaryType}
          fullName={form.fullName}
          onFullNameChange={form.setFullName}
          country={form.country}
          onCountryChange={form.setCountry}
          city={form.city}
          onCityChange={form.setCity}
          residentialAddress={form.residentialAddress}
          onResidentialAddressChange={form.setResidentialAddress}
          riderPhone={form.riderPhone}
          onRiderPhoneChange={form.setRiderPhone}
          age={form.age}
          onAgeChange={form.setAge}
          nationalId={form.nationalId}
          onNationalIdChange={form.setNationalId}
          disabled={form.isSubmitting}
        />

        {/* Paso 4: Ficha médica, antecedentes, grupo sanguíneo y donación */}
        <ActivateMedicalSection
          bloodType={form.bloodType}
          onBloodTypeChange={form.setBloodType}
          customBloodType={form.customBloodType}
          onCustomBloodTypeChange={form.setCustomBloodType}
          insuranceInfo={form.insuranceInfo}
          onInsuranceInfoChange={form.setInsuranceInfo}
          allergies={form.allergies}
          onAllergiesChange={form.setAllergies}
          chronicConditions={form.chronicConditions}
          onChronicConditionsChange={form.setChronicConditions}
          medications={form.medications}
          onMedicationsChange={form.setMedications}
          medicalFindings={form.medicalFindings}
          onMedicalFindingsChange={form.setMedicalFindings}
          isOrganDonor={form.isOrganDonor}
          onIsOrganDonorChange={form.setIsOrganDonor}
          disabled={form.isSubmitting}
        />

        {/* Paso 5: Notas de Rescate y Ubicación Adicional */}
        <ActivateRescueNotesSection
          hasGuardian={form.hasGuardian}
          onHasGuardianChange={form.setHasGuardian}
          rescueNotes={form.rescueNotes}
          onRescueNotesChange={form.setRescueNotes}
          frequentLocation={form.frequentLocation}
          onFrequentLocationChange={form.setFrequentLocation}
          vehicleInfo={form.vehicleInfo}
          onVehicleInfoChange={form.setVehicleInfo}
          disabled={form.isSubmitting}
        />

        {/* Paso 6: repetidor de contactos con selector de cantidad y prefijo de país */}
        <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm">
          <ContactsRepeater
            contacts={form.contacts}
            onChange={form.setContacts}
            disabled={form.isSubmitting}
            requireEmail
          />
        </div>

        {/* Paso 7: consentimiento legal vinculante (safe-legal-and-terms) */}
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

        {/* Banner de error visible con anclaje de scroll */}
        {visibleError && (
          <div ref={errorRef}>
            <IncidentAlertBanner
              type="emergency"
              message={visibleError}
            />
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
