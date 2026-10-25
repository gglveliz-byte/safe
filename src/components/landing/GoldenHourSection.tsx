/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Landing Page — Sección El Principio de la Hora Dorada
 * ARCHIVO: src/components/landing/GoldenHourSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Bloque con animación de borde respiratorio 'golden-hour-border' que expone
 * la justificación médica del protocolo: los primeros 60 minutos del siniestro.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 80 líneas).
 * - Cero texto hardcodeado (consumo de t vía useLocale).
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";

export function GoldenHourSection() {
  const { t } = useLocale();

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="golden-hour-border bg-brand-bg-alt border-l-4 border-l-brand-accent border-y border-r border-brand-border-subtle rounded-r-xl p-6 sm:p-8 md:p-10 shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Etiqueta superior con punto baliza pulsante */}
        <div className="mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping opacity-75" />
          <span className="font-sans text-[11px] md:text-[12px] font-bold text-brand-navy-dark tracking-[0.14em] uppercase">
            {t.landing.quoteTitle}
          </span>
        </div>

        {/* Cita Médica Editorial */}
        <blockquote className="mb-6">
          <p className="font-serif italic font-normal text-[18px] sm:text-[19px] md:text-[21px] leading-[1.6] text-brand-navy-dark">
            {t.landing.quoteBody}
          </p>
        </blockquote>

        {/* Firma de Autoridad */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-brand-border-strong" />
          <cite className="not-italic font-sans text-xs md:text-sm font-medium text-brand-text-muted">
            {t.landing.quoteAuthor}
          </cite>
        </div>
      </div>
    </section>
  );
}
