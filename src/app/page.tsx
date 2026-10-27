/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 1: Landing Page Editorial (SAFE 2026)
 * ARCHIVO: src/app/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Portada institucional y técnica de la plataforma SAFE bajo la estética
 * 'Technical Broadsheet 2026'. Presenta el boletín médico vital en el casco,
 * la visualización con radares sónar activos sobre NFC/QR, el modal interactivo
 * de ficha médica de emergencia (demo), el formulario real de activación de tag,
 * el flujo funcional en carretera en 3 pasos y la cita de la Hora Dorada.
 *
 * ENTRADAS: diccionario bilingüe vía useLocale.
 * SALIDAS: navegación real y apertura de modales accesibles.
 * DEPENDENCIAS: HelmetHeroCard, HelmetActivationSection, HowItWorksSection,
 *               GoldenHourSection, DemoMedicalModal.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 220 líneas).
 * - Cero textos hardcodeados (100% t vía useLocale).
 * - Cero datos mock o folios inventados en la activación.
 * - 100% responsive: diseño adaptativo continuo para móviles, tablets y desktop.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { HelmetHeroCard } from "@/components/landing/HelmetHeroCard";
import { HelmetActivationSection } from "@/components/landing/HelmetActivationSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { GoldenHourSection } from "@/components/landing/GoldenHourSection";
import { DemoMedicalModal } from "@/components/landing/DemoMedicalModal";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function HomePage() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const openDemoModal = () => {
    triggerHaptic("light");
    setDemoModalOpen(true);
  };

  const closeDemoModal = () => {
    triggerHaptic("light");
    setDemoModalOpen(false);
  };

  return (
    <div className="w-full bg-brand-white">
      {/* ══════════════════ HERO SECTION (BROADSHEET 2026) ══════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16 pb-12 md:pb-16 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Columna Izquierda: Información Editorial (aprox. 58%) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Tag Superior con Baliza Sónar y Logotipo Oficial */}
            <div className="flex items-center gap-3 mb-5 animate-fadeInDown">
              <BrandLogo size="xs" ringVariant="accent" />
              <span className="font-sans text-[11px] md:text-[12px] font-semibold text-brand-text-muted tracking-[0.14em] uppercase">
                {t.landing.badgeText}
              </span>
            </div>

            {/* Titular Principal en Serif Newsreader */}
            <h1 className="font-serif font-bold text-[30px] sm:text-[38px] lg:text-[44px] leading-[1.14] text-brand-navy-dark mb-6 tracking-[-0.015em]">
              {t.landing.heroHeadline}
            </h1>

            {/* Párrafo Descriptivo */}
            <p className="font-sans text-[16px] sm:text-[17px] md:text-[18px] leading-[1.6] text-brand-text-desc max-w-[620px] mb-8 font-normal">
              {t.landing.heroSubheadline}
            </p>

            {/* Botones de Acción Interactivos */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={openDemoModal}
                aria-haspopup="dialog"
                className="group inline-flex items-center justify-center px-6 py-3.5 bg-brand-white text-brand-navy-dark border border-brand-border-subtle hover:border-brand-nav-blue hover:bg-brand-nav-active hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-[13px] md:text-[14px] font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
              >
                <span>{t.landing.exploreEmergencyCta}</span>
                <svg
                  className="ml-2.5 w-4 h-4 text-brand-nav-blue transform group-hover:translate-x-1.5 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <Link
                href="/#activar-casco"
                onClick={() => triggerHaptic("light")}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-[13px] md:text-[14px] font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-nav-blue no-underline"
              >
                {t.nav.activateHelmet}
              </Link>
            </div>

            {/* Micro-indicador de Confianza */}
            <div className="mt-8 pt-6 border-t border-brand-separator flex items-center gap-4 text-xs text-brand-text-muted">
              <span className="inline-flex items-center gap-1.5 font-medium group cursor-default">
                <svg className="w-4 h-4 text-brand-nav-blue group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {t.landing.trustNfcQr}
              </span>
              <span className="w-1 h-1 rounded-full bg-brand-border-strong" aria-hidden="true" />
              <span>{t.landing.trustNoDownloads}</span>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Fotográfica con Radares Sónar */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <HelmetHeroCard />
          </div>
        </div>
      </section>

      {/* ══════════ SECCIÓN: FORMULARIO PARA ACTIVAR EL CASCO ══════════ */}
      <HelmetActivationSection />

      {/* ══════════ SECCIÓN: ¿CÓMO FUNCIONA SAFE EN CARRETERA? ══════════ */}
      <HowItWorksSection />

      {/* ══════════ SECCIÓN: EL PRINCIPIO DE LA HORA DORADA ══════════ */}
      <GoldenHourSection />

      {/* ══════════ MODAL: FICHA MÉDICA DE DEMOSTRACIÓN ══════════ */}
      <DemoMedicalModal isOpen={demoModalOpen} onClose={closeDemoModal} />
    </div>
  );
}
