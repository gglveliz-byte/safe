/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Landing Page — Sección de Funcionamiento en Carretera
 * ARCHIVO: src/components/landing/HowItWorksSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Presenta los 3 pasos esenciales del protocolo SAFE (adhesivo físico,
 * registro clínico y auxilio inmediato) con micro-animaciones en tarjetas.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 150 líneas).
 * - Cero texto hardcodeado (consumo de t vía useLocale).
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";

export function HowItWorksSection() {
  const { t } = useLocale();

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Encabezado de la Sección */}
      <div className="mb-10 md:mb-12">
        <h2 className="font-serif font-bold text-[30px] sm:text-[34px] md:text-[38px] text-brand-navy-dark tracking-tight mb-3">
          {t.landing.howItWorksTitle}
        </h2>
        <p className="font-sans text-[16px] md:text-[17px] text-brand-text-desc max-w-2xl">
          {t.landing.howItWorksSubtitle}
        </p>
      </div>

      {/* Grid de 3 Pasos con Elevación Suave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* Paso 1: Pegas el chip en tu casco */}
        <article className="feature-card bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 flex flex-col justify-between hover:border-brand-border-strong hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-default">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="card-badge w-8 h-8 rounded-full bg-brand-navy-dark text-white font-sans font-bold text-xs flex items-center justify-center transition-all duration-200">
                1
              </span>
              <div className="card-icon-wrap w-10 h-10 rounded-lg bg-brand-nav-active text-brand-nav-blue flex items-center justify-center transition-all duration-300 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4a8 8 0 00-8 8v2a4 4 0 004 4h7a5 5 0 005-5v-1a8 8 0 00-8-8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  <path d="M12 9a4 4 0 00-4 4h5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  <path d="M19 8a5 5 0 010 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              </div>
            </div>
            <h3 className="font-serif font-bold text-[20px] md:text-[22px] text-brand-navy-dark leading-snug mb-3">
              {t.landing.step1Title}
            </h3>
            <p className="font-sans text-[15px] leading-relaxed text-brand-text-desc">
              {t.landing.step1Desc}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-brand-separator flex items-center text-xs text-brand-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-nav-blue mr-2" />
            {t.landing.card1Footer}
          </div>
        </article>

        {/* Paso 2: Registras tus datos vitales */}
        <article className="feature-card bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 flex flex-col justify-between hover:border-brand-border-strong hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-default">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="card-badge w-8 h-8 rounded-full bg-brand-navy-dark text-white font-sans font-bold text-xs flex items-center justify-center transition-all duration-200">
                2
              </span>
              <div className="card-icon-wrap w-10 h-10 rounded-lg bg-brand-nav-active text-brand-nav-blue flex items-center justify-center transition-all duration-300 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  <path d="M12 8v2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              </div>
            </div>
            <h3 className="font-serif font-bold text-[20px] md:text-[22px] text-brand-navy-dark leading-snug mb-3">
              {t.landing.step2Title}
            </h3>
            <p className="font-sans text-[15px] leading-relaxed text-brand-text-desc">
              {t.landing.step2Desc}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-brand-separator flex items-center text-xs text-brand-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-nav-blue mr-2" />
            {t.landing.card2Footer}
          </div>
        </article>

        {/* Paso 3: Auxilio inmediato sin demoras */}
        <article className="feature-card bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 flex flex-col justify-between hover:border-brand-border-strong hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-default">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="card-badge w-8 h-8 rounded-full bg-brand-navy-dark text-white font-sans font-bold text-xs flex items-center justify-center transition-all duration-200">
                3
              </span>
              <div className="card-icon-wrap w-10 h-10 rounded-lg bg-brand-nav-active text-brand-nav-blue flex items-center justify-center transition-all duration-300 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  <circle cx="12" cy="10" r="2.5" strokeWidth="1.8" />
                </svg>
              </div>
            </div>
            <h3 className="font-serif font-bold text-[20px] md:text-[22px] text-brand-navy-dark leading-snug mb-3">
              {t.landing.step3Title}
            </h3>
            <p className="font-sans text-[15px] leading-relaxed text-brand-text-desc">
              {t.landing.step3Desc}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-brand-separator flex items-center text-xs text-brand-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mr-2" />
            {t.landing.card3Footer}
          </div>
        </article>
      </div>
    </section>
  );
}
