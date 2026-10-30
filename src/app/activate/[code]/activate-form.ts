/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Hook de Registro de Cuenta de Piloto (Fase 1)
 * ARCHIVO: src/app/activate/[code]/activate-form.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Hook `useActivateForm` para la Fase 1 del Onboarding de SAFE:
 * Registra la cuenta del motociclista (nombre, correo, celular, país, contraseña)
 * vinculado al folio del chip escaneado (QR/NFC) SIN solicitar el PIN secreto
 * ni los datos médicos en esta etapa. El PIN y la ficha médica se completan
 * tras el inicio de sesión seguro dentro del dashboard.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos simulados: integración real con POST /api/auth/register.
 * - Cabecera canónica y comentarios en español.
 * ==============================================================================
 */

"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { type Dictionary, type Locale } from "@/locales";

export interface RegisterSuccessResult {
  redirect?: string;
  deviceCode: string;
  email: string;
  fullName: string;
  riderPhone: string;
}

export function useActivateForm(code: string, locale: Locale, t: Dictionary) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<RegisterSuccessResult | null>(null);

  const submit = async (): Promise<boolean> => {
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage(`${t.activate.fullNameLabel}: ${t.common.requiredField}`);
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage(`${t.activate.emailLabel}: ${t.common.requiredField}`);
      return false;
    }
    if (!riderPhone.trim()) {
      setErrorMessage(`${t.activate.riderPhoneLabel}: ${t.common.requiredField}`);
      return false;
    }
    if (password.length < 8) {
      setErrorMessage(t.activate.passwordPlaceholder);
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t.activate.errorPasswordsMismatch);
      return false;
    }
    if (!termsAccepted) {
      setErrorMessage(`${t.activate.acceptTermsPre} ${t.common.termsLink}`);
      return false;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.registerRider({
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        fullName: fullName.trim(),
        riderPhone: riderPhone.trim(),
        termsAccepted: true,
        deviceCode: code,
        locale,
      });

      if (!res.success) {
        throw new Error(res.message || t.common.errorGeneric);
      }

      const dashParams = new URLSearchParams();
      if (code) dashParams.set("claim", code);
      const dashQuery = dashParams.toString();
      const targetDashboard = dashQuery ? `/dashboard?${dashQuery}` : "/dashboard";

      const loginParams = new URLSearchParams();
      loginParams.set("registered", "1");
      loginParams.set("email", email.trim().toLowerCase());
      loginParams.set("redirect", targetDashboard);
      const redirectUrl = `/login?${loginParams.toString()}`;

      setSuccessResult({
        redirect: redirectUrl,
        deviceCode: code,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        riderPhone: riderPhone.trim(),
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.common.errorGeneric;
      setErrorMessage(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    riderPhone,
    setRiderPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    termsAccepted,
    setTermsAccepted,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    successResult,
    submit,
  };
}
