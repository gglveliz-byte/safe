/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 7A: Términos y Condiciones del Servicio
 * ARCHIVO: src/app/terms/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Página legal oficial de Términos del Servicio. Regula las condiciones de uso
 * del kit físico (NFC y QR), la exención de responsabilidad del Buen Samaritano
 * para socorristas y testigos, los deberes de veracidad médica del motociclista
 * y el alcance de cobertura satelital.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Marco legal canónico exigido por la skill safe-legal-and-terms.
 * - Cero textos hardcodeados (100% t).
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentHairline } from "@/components/ui/IncidentHairline";

export default function TermsPage() {
  const { t } = useLocale();

  return (
    <div className="safe-mobile-container py-8 sm:py-12 flex flex-col gap-8">
      {/* Encabezado Broadsheet Legal */}
      <section className="flex flex-col gap-2 border-b border-ink pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-signal-orange" />
          <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-carbon">
            DOCUMENTO PÚBLICO OFICIAL
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
          {t.legal.termsTitle}
        </h1>
        <p className="font-serif text-body text-carbon">
          {t.legal.termsSubtitle}
        </p>
        <span className="font-sans text-[12px] text-carbon font-semibold mt-1">
          {t.legal.lastUpdated}
        </span>
      </section>

      {/* Cláusulas Legales en Tarjetas Broadsheet */}
      <div className="flex flex-col gap-6">
        {/* Sección 1 */}
        <IncidentCard padding="md">
          <h2 className="font-serif text-heading-sm font-bold text-ink mb-2">
            {t.legal.termsSection1Title}
          </h2>
          <p className="font-serif text-body text-carbon leading-relaxed">
            {t.legal.termsSection1Body}
          </p>
        </IncidentCard>

        {/* Sección 2: El Buen Samaritano */}
        <IncidentCard padding="md" variant="emergency" className="bg-white">
          <h2 className="font-serif text-heading-sm font-bold text-ink mb-2 flex items-center gap-2">
            <span>⚖️</span>
            <span>{t.legal.termsSection2Title}</span>
          </h2>
          <p className="font-serif text-body text-ink leading-relaxed font-medium">
            {t.legal.termsSection2Body}
          </p>
        </IncidentCard>

        {/* Sección 3 */}
        <IncidentCard padding="md">
          <h2 className="font-serif text-heading-sm font-bold text-ink mb-2">
            {t.legal.termsSection3Title}
          </h2>
          <p className="font-serif text-body text-carbon leading-relaxed">
            {t.legal.termsSection3Body}
          </p>
        </IncidentCard>

        {/* Sección 4 */}
        <IncidentCard padding="md">
          <h2 className="font-serif text-heading-sm font-bold text-ink mb-2">
            {t.legal.termsSection4Title}
          </h2>
          <p className="font-serif text-body text-carbon leading-relaxed">
            {t.legal.termsSection4Body}
          </p>
        </IncidentCard>
      </div>

      <IncidentHairline variant="subtle" />

      {/* Navegación Cruzada hacia Privacidad y Portada */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-sans text-micro">
        <Link
          href="/privacy"
          className="text-ink hover:text-signal-orange underline font-semibold"
        >
          → {t.common.privacyLink}
        </Link>

        <Link
          href="/"
          className="text-carbon hover:text-ink transition-colors"
        >
          ← {t.common.backToHome}
        </Link>
      </div>
    </div>
  );
}
