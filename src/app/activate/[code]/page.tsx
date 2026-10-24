/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 2: Activación y Registro de Kit Virgen
 * ARCHIVO: src/app/activate/[code]/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Flujo de onboarding del motociclista al adquirir su kit físico de casco.
 * Solicita el PIN secreto raspable de 6 dígitos, credenciales de cuenta,
 * datos clínicos prioritarios (sangre, alergias), fotografía de rostro,
 * contactos satelitales ilimitados y consentimiento vinculante de términos
 * y política de tratamiento de datos médicos.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Casilla de verificación de consentimiento legal obligatoria (safe-legal-and-terms).
 * - Cero textos hardcodeados (100% t).
 * ==============================================================================
 */

"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient, type EmergencyContact, type MedicalProfileData } from "@/lib/api-client";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { IncidentHairline } from "@/components/ui/IncidentHairline";
import { CloudinaryPhotoPicker } from "@/components/medical/CloudinaryPhotoPicker";
import { ContactsRepeater } from "@/components/medical/ContactsRepeater";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function ActivatePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const code = (resolvedParams?.code || "SAFE-0001").toUpperCase();

  const router = useRouter();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Estados del formulario
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [insurance, setInsurance] = useState("");
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: "cnt_init_1", name: "", phone: "", relationship: "" },
  ]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!termsAccepted) {
      triggerHaptic("error");
      setErrorMessage(t.common.requiredField + ": " + t.common.termsLink);
      return;
    }

    if (pin.length !== 6) {
      triggerHaptic("error");
      setErrorMessage(t.activate.errorPinInvalid);
      return;
    }

    setIsLoading(true);
    triggerHaptic("light");

    try {
      const medicalData: MedicalProfileData = {
        fullName,
        nationalId,
        bloodType,
        allergies,
        conditions,
        medications,
        insurance,
        photoUrl,
        contacts: contacts.filter((c) => c.name.trim() && c.phone.trim()),
      };

      await apiClient.activateDevice({
        code,
        activationPin: pin,
        email,
        password,
        medicalData,
      });

      triggerHaptic("success");
      setIsSuccess(true);
    } catch (err: any) {
      triggerHaptic("error");
      setErrorMessage(err?.message || t.common.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  // Pantalla de Confirmación Exitosa
  if (isSuccess) {
    return (
      <div className="safe-mobile-container py-12 flex flex-col items-center justify-center text-center">
        <IncidentCard padding="lg" className="max-w-md w-full flex flex-col items-center gap-4 border-2">
          <div className="w-16 h-16 rounded-full bg-concrete border-2 border-ink flex items-center justify-center text-3xl">
            🛡️
          </div>
          <h2 className="font-serif text-heading-sm font-bold text-ink">
            {t.activate.successTitle}
          </h2>
          <p className="font-serif text-body text-carbon">
            {t.activate.successMessage}
          </p>
          <span className="font-mono text-micro font-bold bg-concrete px-3 py-1 border border-ink rounded-[4px]">
            {code}
          </span>
          <IncidentButton
            type="button"
            variant="emergency"
            size="lg"
            onClick={() => router.push("/dashboard")}
            className="w-full mt-2"
          >
            {t.activate.goToDashboard} →
          </IncidentButton>
        </IncidentCard>
      </div>
    );
  }

  return (
    <div className="safe-mobile-container py-8 sm:py-12 flex flex-col gap-8">
      {/* Encabezado Broadsheet */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-micro font-bold bg-ink text-paper px-2 py-0.5 rounded-[3px]">
            {code}
          </span>
          <span className="font-sans text-micro font-bold uppercase text-signal-orange">
            {t.common.statusUnclaimed}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
          {t.activate.title}
        </h1>
        <p className="font-serif text-body text-carbon">
          {t.activate.subtitle}
        </p>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Paso 1: PIN Secreto de Activación y Cuenta */}
        <IncidentCard padding="md" className="flex flex-col gap-4">
          <div className="border-b border-mist pb-2">
            <h3 className="font-serif font-bold text-heading-sm text-ink">
              {t.activate.stepPinTitle}
            </h3>
            <p className="font-sans text-micro text-carbon mt-0.5">
              {t.activate.pinHelp}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* PIN de 6 dígitos */}
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.pinLabel} *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder={t.activate.pinPlaceholder}
                required
                className="h-12 px-3 bg-concrete border-2 border-ink rounded-[4px] font-mono text-heading-sm font-bold tracking-widest text-center text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            {/* Correo Electrónico */}
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.emailLabel} *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.activate.emailPlaceholder}
                required
                className="h-12 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.passwordLabel} *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.activate.passwordPlaceholder}
                required
                minLength={8}
                className="h-12 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>
        </IncidentCard>

        {/* Paso 2: Foto de Reconocimiento Facial */}
        <CloudinaryPhotoPicker
          currentPhotoUrl={photoUrl}
          onPhotoSelected={(dataUri) => setPhotoUrl(dataUri)}
          disabled={isLoading}
        />

        {/* Paso 3: Ficha Médica Personal */}
        <IncidentCard padding="md" className="flex flex-col gap-4">
          <div className="border-b border-mist pb-2">
            <h3 className="font-serif font-bold text-heading-sm text-ink">
              {t.emergency.title}
            </h3>
            <p className="font-sans text-micro text-carbon mt-0.5">
              {t.emergency.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Nombre Completo */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.fullNameLabel} *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.activate.fullNamePlaceholder}
                required
                className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            {/* Grupo Sanguíneo */}
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.bloodTypeLabel} *
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="h-11 px-3 bg-concrete border-2 border-ink rounded-[4px] font-serif text-body font-bold text-ink focus:outline-none cursor-pointer"
              >
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Cédula / Documento de Identidad */}
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.nationalIdLabel} *
              </label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder={t.activate.nationalIdPlaceholder}
                required
                className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>

            {/* Seguro de Salud */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.insuranceLabel}
              </label>
              <input
                type="text"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                placeholder={t.activate.insurancePlaceholder}
                className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          <IncidentHairline variant="subtle" margin="sm" />

          {/* Alergias, Patologías y Medicamentos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-alert-red">
                {t.activate.allergiesLabel}
              </label>
              <textarea
                rows={3}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder={t.activate.allergiesPlaceholder}
                className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.conditionsLabel}
              </label>
              <textarea
                rows={3}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder={t.activate.conditionsPlaceholder}
                className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-micro font-bold uppercase text-carbon">
                {t.activate.medicationsLabel}
              </label>
              <textarea
                rows={3}
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder={t.activate.medicationsPlaceholder}
                className="p-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink resize-none"
              />
            </div>
          </div>
        </IncidentCard>

        {/* Paso 4: Repetidor Dinámico de Contactos */}
        <ContactsRepeater
          contacts={contacts}
          onChange={(newContacts) => setContacts(newContacts)}
          disabled={isLoading}
        />

        {/* Paso 5: Consentimiento Legal Vinculante (safe-legal-and-terms) */}
        <div className="p-4 bg-paper border border-ink rounded-[8px]">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-ink text-signal-orange focus:ring-0 cursor-pointer"
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

        {/* Aviso de Error */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-alert-red rounded-[8px] text-micro text-alert-red font-sans font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Botón de Envío */}
        <div className="pt-2">
          <IncidentButton
            type="submit"
            variant="emergency"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? t.activate.submittingButton : t.activate.submitButton}
          </IncidentButton>
        </div>
      </form>
    </div>
  );
}
