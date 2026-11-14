/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 1: Landing Page Editorial (SAFE 2026)
 * ARCHIVO: src/app/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Portada institucional y técnica de la plataforma SAFE bajo la estética
 * 'Technical Broadsheet 2026'. Presenta el boletín médico vital en el casco,
 * el reproductor oficial de video vertical 9:16, el punto de atención con mapa,
 * el flujo funcional en carretera en 3 pasos y la cita de la Hora Dorada.
 *
 * ENTRADAS: diccionario bilingüe vía useLocale.
 * SALIDAS: navegación real y apertura de modales accesibles.
 * DEPENDENCIAS: HeroVideoCard, HowItWorksSection, LocationAndMapSection,
 *               GoldenHourSection, TestimonialsCarousel, SocialAndContactSection.
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
import { HeroVideoCard } from "@/components/landing/HeroVideoCard";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LocationAndMapSection } from "@/components/landing/LocationAndMapSection";
import { GoldenHourSection } from "@/components/landing/GoldenHourSection";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { SocialAndContactSection } from "@/components/landing/SocialAndContactSection";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { FloatingWhatsAppButton } from "@/components/ui/FloatingWhatsAppButton";
import { FloatingShareButton } from "@/components/ui/FloatingShareButton";
import { ShareWebsiteModal } from "@/components/ui/ShareWebsiteModal";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";

export default function HomePage() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="w-full bg-brand-white">
      {/* ══════════════════ HERO SECTION (BROADSHEET 2026) ══════════════════ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-10 md:pb-12 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Columna Izquierda: Información Editorial (aprox. 58%) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Tag Superior con Baliza Sónar y Logotipo Oficial */}
            <div className="flex items-center gap-3 mb-4 animate-fadeInDown">
              <BrandLogo size="xs" ringVariant="accent" />
              <span className="font-sans text-[11px] md:text-[12px] font-semibold text-brand-text-muted tracking-[0.14em] uppercase">
                {t.landing.badgeText}
              </span>
            </div>

            {/* Subtítulo / Rótulo de Servicio Solicitado por el Cliente */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-sans text-[12px] sm:text-[13px] font-bold text-brand-accent tracking-[0.12em] uppercase">
                {t.landing.heroServiceLabel}
              </span>
            </div>

            {/* Titular Principal Moderado y Elegante (no tan grande) */}
            <h1 className="font-serif font-bold text-[26px] sm:text-[32px] md:text-[36px] leading-[1.2] text-brand-navy-dark mb-5 tracking-[-0.01em]">
              {t.landing.heroHeadline}
            </h1>

            {/* Párrafo Descriptivo */}
            <p className="font-sans text-[15px] sm:text-[16px] md:text-[17px] leading-[1.62] text-brand-text-desc max-w-[620px] mb-8 font-normal">
              {t.landing.heroSubheadline}
            </p>

            {/* Fila de Acciones: Iniciar Sesión + Compartir Web & QR */}
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/login"
                onClick={() => triggerHaptic("light")}
                className="group inline-flex items-center justify-center px-7 py-3.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-[14px] md:text-[15px] font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-nav-blue no-underline"
              >
                <span>{t.nav.login}</span>
                <svg
                  className="ml-2.5 w-4 h-4 text-brand-accent transform group-hover:translate-x-1.5 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setShareOpen(true);
                }}
                className="inline-flex items-center justify-center px-5 py-3.5 bg-white border border-brand-border-strong text-brand-navy-dark hover:bg-brand-nav-active hover:border-brand-navy-secondary text-[14px] md:text-[15px] font-semibold rounded-md shadow-sm hover:shadow transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-nav-blue"
              >
                <svg
                  className="mr-2 w-4 h-4 text-brand-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span>{t.landing.shareWebsiteBtn}</span>
              </button>
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

          {/* Columna Derecha: Video Spot Oficial ALTUS-CHIP (9:16) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <HeroVideoCard />
          </div>
        </div>
      </section>


      {/* ══════════ SECCIÓN: SEDE MATRIZ & MAPA INTERACTIVO (UNIFICADO) ══════════ */}
      <LocationAndMapSection />

      {/* ══════════ SECCIÓN: ¿CÓMO FUNCIONA EN CARRETERA? ══════════ */}
      <HowItWorksSection />

      {/* ══════════ SECCIÓN: EL PRINCIPIO DE LA HORA DORADA ══════════ */}
      <GoldenHourSection />

      {/* ══════════ SECCIÓN: TESTIMONIOS Y EXPERIENCIA 5 ESTRELLAS ══════════ */}
      <TestimonialsCarousel onOpenFeedback={() => setFeedbackOpen(true)} />

      {/* ══════════ SECCIÓN: REDES SOCIALES Y CONTACTO ══════════ */}
      <SocialAndContactSection />

      {/* ══════════ BOTONES FLOTANTES: COMPARTIR WEB/QR (SUPERIOR) Y WHATSAPP (BASE) ══════════ */}
      <FloatingShareButton onClick={() => setShareOpen(true)} />
      <FloatingWhatsAppButton />

      {/* ══════════ MODAL DE DIFUSIÓN WEB Y CÓDIGO QR OFICIAL ══════════ */}
      <ShareWebsiteModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />

      {/* ══════════ MODAL DE OPINIÓN Y RETROALIMENTACIÓN ══════════ */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
