/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 1: Landing Page Informativa Editorial
 * ARCHIVO: src/app/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Portada principal broadsheet de la plataforma. Explica el funcionamiento
 * del chip en el casco, el principio médico de la 'Hora Dorada', estadísticas
 * de respuesta en carretera y accesos directos para activar nuevos kits o
 * consultar la ficha médica de auxilio.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero textos hardcodeados (100% t vía useLocale).
 * - Cero gradientes, estética pura 'Incident' sobre concreto #efefef.
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentHairline } from "@/components/ui/IncidentHairline";

export default function HomePage() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  return (
    <div className="safe-mobile-container py-8 sm:py-12 flex flex-col gap-10">
      {/* Insignia Editorial Superior */}
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-signal-orange" />
        <span className="font-sans text-[12px] font-bold uppercase tracking-widest text-carbon">
          {t.landing.badgeText}
        </span>
      </div>

      {/* Titular Principal Broadsheet */}
      <section className="flex flex-col gap-5">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-ink leading-[1.15] tracking-tight">
          {t.landing.heroHeadline}
        </h1>
        <p className="font-serif text-body sm:text-body-lg text-ink leading-relaxed max-w-2xl">
          {t.landing.heroSubheadline}
        </p>

        {/* Botones de Acción Primarios */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/activate/SAFE-0001"
            onClick={() => triggerHaptic("light")}
            className="btn-emergency text-body font-bold no-underline"
          >
            <span>{t.landing.activateCta}</span>
            <span>→</span>
          </Link>

          <Link
            href="/emergency/SAFE-0001"
            onClick={() => triggerHaptic("light")}
            className="btn-neutral text-body font-medium no-underline"
          >
            <span>🚨 {t.landing.exploreEmergencyCta}</span>
          </Link>
        </div>
      </section>

      <IncidentHairline variant="solid" />

      {/* Franja de Estadísticas Técnicas */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <IncidentCard padding="sm" className="text-center">
          <span className="font-serif text-heading font-bold text-ink">
            {t.landing.statsHelmets}
          </span>
          <span className="font-sans text-micro text-carbon block mt-1">
            {t.landing.statsHelmetsLabel}
          </span>
        </IncidentCard>

        <IncidentCard padding="sm" className="text-center">
          <span className="font-serif text-heading font-bold text-signal-orange">
            {t.landing.statsResponseTime}
          </span>
          <span className="font-sans text-micro text-carbon block mt-1">
            {t.landing.statsResponseTimeLabel}
          </span>
        </IncidentCard>

        <IncidentCard padding="sm" className="text-center">
          <span className="font-serif text-heading font-bold text-ink">
            {t.landing.statsUptime}
          </span>
          <span className="font-sans text-micro text-carbon block mt-1">
            {t.landing.statsUptimeLabel}
          </span>
        </IncidentCard>
      </section>

      {/* Sección: ¿Cómo Funciona en Carretera? */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="font-serif text-heading-sm sm:text-heading font-bold text-ink">
            {t.landing.howItWorksTitle}
          </h2>
          <p className="font-serif text-body text-carbon mt-1">
            {t.landing.howItWorksSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Paso 1 */}
          <IncidentCard padding="md" className="flex flex-col justify-between">
            <div>
              <span className="w-7 h-7 rounded-[4px] bg-ink text-paper font-sans text-micro font-bold flex items-center justify-center mb-3">
                1
              </span>
              <h3 className="font-serif text-body-lg font-bold text-ink mb-2">
                {t.landing.step1Title}
              </h3>
              <p className="font-serif text-body text-carbon leading-relaxed">
                {t.landing.step1Desc}
              </p>
            </div>
          </IncidentCard>

          {/* Paso 2 */}
          <IncidentCard padding="md" className="flex flex-col justify-between">
            <div>
              <span className="w-7 h-7 rounded-[4px] bg-ink text-paper font-sans text-micro font-bold flex items-center justify-center mb-3">
                2
              </span>
              <h3 className="font-serif text-body-lg font-bold text-ink mb-2">
                {t.landing.step2Title}
              </h3>
              <p className="font-serif text-body text-carbon leading-relaxed">
                {t.landing.step2Desc}
              </p>
            </div>
          </IncidentCard>

          {/* Paso 3 */}
          <IncidentCard padding="md" className="flex flex-col justify-between">
            <div>
              <span className="w-7 h-7 rounded-[4px] bg-signal-orange text-paper font-sans text-micro font-bold flex items-center justify-center mb-3">
                3
              </span>
              <h3 className="font-serif text-body-lg font-bold text-ink mb-2">
                {t.landing.step3Title}
              </h3>
              <p className="font-serif text-body text-carbon leading-relaxed">
                {t.landing.step3Desc}
              </p>
            </div>
          </IncidentCard>
        </div>
      </section>

      {/* Cita Médica Editorial: La Hora Dorada */}
      <section className="bg-paper border border-ink rounded-[12px] p-6 sm:p-8 shadow-incident flex flex-col gap-3">
        <span className="font-sans text-micro uppercase tracking-widest font-bold text-signal-orange">
          {t.landing.quoteTitle}
        </span>
        <blockquote className="font-serif text-body sm:text-body-lg italic text-ink leading-relaxed">
          {t.landing.quoteBody}
        </blockquote>
        <span className="font-sans text-micro text-carbon font-semibold text-right">
          — {t.landing.quoteAuthor}
        </span>
      </section>
    </div>
  );
}
