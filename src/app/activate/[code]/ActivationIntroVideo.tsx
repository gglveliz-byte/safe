/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación — Pantalla Introductoria de Video (Primer Escaneo QR/NFC)
 * ARCHIVO: src/app/activate/[code]/ActivationIntroVideo.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Muestra el video vertical oficial de ALTUS-CHIP únicamente cuando un usuario
 * escanea un kit nuevo (QR o NFC) por primera vez para activarlo, invitándolo
 * a escuchar el funcionamiento antes de continuar al registro de su ficha.
 * Una vez omitido o completado el registro, jamás vuelve a aparecer en el flujo.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { HeroVideoCard } from "@/components/landing/HeroVideoCard";

export interface ActivationIntroVideoProps {
  code: string;
  onContinue: () => void;
}

export function ActivationIntroVideo({
  code,
  onContinue,
}: ActivationIntroVideoProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const handleContinueClick = () => {
    triggerHaptic("light");
    onContinue();
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-8 min-h-[100dvh] flex flex-col gap-3.5 sm:gap-5 animate-fadeInUp">
      {/* Cabecera compacta con insignia de primera activación y folio */}
      <header className="flex flex-col gap-1.5 border-b border-brand-separator pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-nav-active text-brand-navy-dark border border-brand-nav-blue/25">
            {t.activate.introBadge}
          </span>
          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-brand-bg-alt border border-brand-border-subtle rounded-md text-brand-navy-dark">
            {code}
          </span>
        </div>
        <h1 className="font-serif text-lg sm:text-2xl font-bold text-brand-navy-dark leading-tight mt-0.5">
          {t.activate.introTitle}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-brand-text-desc leading-snug">
          {t.activate.introSubtitle}
        </p>
      </header>

      {/* Reproductor Vertical Oficial 9:16 reutilizado de la portada */}
      <div className="w-full flex justify-center">
        <HeroVideoCard maxWidthClass="max-w-[218px] sm:max-w-[268px]" />
      </div>

      {/* Acciones claras >= 44px táctiles visibles sin scroll excesivo en móvil */}
      <div className="flex flex-col items-center gap-1.5 pb-6">
        <button
          type="button"
          onClick={handleContinueClick}
          className="w-full max-w-sm min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary active:scale-[0.99] text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
        >
          {t.activate.introContinueButton}
        </button>

        <button
          type="button"
          onClick={handleContinueClick}
          className="min-h-[44px] px-4 inline-flex items-center justify-center font-sans text-xs font-medium text-brand-text-muted hover:text-brand-navy-dark underline underline-offset-2 transition-colors cursor-pointer"
        >
          {t.activate.introSkipButton}
        </button>
      </div>
    </div>
  );
}
