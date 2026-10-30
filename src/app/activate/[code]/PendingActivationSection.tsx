/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación de Kit — Vista de Espera de PIN / Bloqueo Pre-Activación
 * ARCHIVO: src/app/activate/[code]/PendingActivationSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Vista de custodia y activación inmediata de PIN en el onboarding:
 * (1) Muestra los datos ya registrados y asegurados del piloto (modo solo lectura),
 *     impidiendo que se alteren o se pierdan tras el registro inicial.
 * (2) Incrusta la tarjeta de vinculación segura ClaimDeviceCard para que el usuario
 *     digite el PIN de 6 dígitos enviado por el administrador/asesor sin necesidad
 *     de salir al login ni navegar manualmente al dashboard.
 * (3) Al verificar el PIN con éxito, activa el kit y transiciona al dashboard.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 150 líneas).
 * - Cero textos hardcodeados: 100% diccionario vía useLocale.
 * - Paleta Incident oficial, accesibilidad táctil ≥44px y háptica.
 * ==============================================================================
 */

"use client";

import React from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ClaimDeviceCard } from "@/components/dashboard/ClaimDeviceCard";
import { useLocale } from "@/hooks/useLocale";

export interface PendingActivationSectionProps {
  deviceCode: string;
  fullName: string;
  email: string;
  riderPhone?: string;
  isPinDispatchMode?: boolean;
  onActivated: () => void;
}

export function PendingActivationSection({
  deviceCode,
  fullName,
  email,
  riderPhone,
  isPinDispatchMode = true,
  onActivated,
}: PendingActivationSectionProps) {
  const { t } = useLocale();

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 min-h-[100dvh] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] flex flex-col gap-6 animate-fadeInUp">
      {/* Encabezado Broadsheet */}
      <section className="flex flex-col gap-2 border-b border-brand-separator pb-4">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="sm" />
          <span className="font-sans text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
            {t.common.appName} · {t.activate.registeredDriverBadge}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy-dark leading-tight">
          {t.dashboard.claimTitle}
        </h1>
        <p className="font-sans text-sm text-brand-text-desc leading-relaxed">
          {t.activate.successAccountSubtitle}
        </p>
      </section>

      {/* Tarjeta de Datos Registrados Fijos (Solo Lectura) */}
      <div className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-brand-separator">
          <div className="flex items-center gap-2 text-emerald-800 font-sans text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
            <span>✓ {t.activate.registeredDriverBadge}</span>
          </div>
          <span className="font-sans text-[11px] text-brand-text-muted uppercase tracking-wider">
            {t.activate.pendingAccountNotice}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="flex flex-col gap-0.5">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
              {t.activate.fullNameLabel}
            </span>
            <span className="font-sans text-sm font-semibold text-brand-navy-dark">
              {fullName}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
              {t.activate.emailLabel}
            </span>
            <span className="font-sans text-sm font-semibold text-brand-navy-dark">
              {email}
            </span>
          </div>

          {riderPhone && (
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                {t.activate.riderPhoneLabel}
              </span>
              <span className="font-sans text-sm font-semibold text-brand-navy-dark">
                {riderPhone}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta interactiva de ingreso de PIN de 6 dígitos */}
      <ClaimDeviceCard
        prefilledCode={deviceCode}
        isPinDispatchMode={isPinDispatchMode}
        onClaimSuccess={onActivated}
      />
    </div>
  );
}

