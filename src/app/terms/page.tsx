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
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8 animate-fadeInUp">
      {/* Encabezado Broadsheet Legal */}
      <section className="flex flex-col gap-2 border-b border-brand-separator pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy-dark leading-tight">
          {t.legal.termsTitle}
        </h1>
        <p className="font-sans text-sm sm:text-base text-brand-text-desc">
          {t.legal.termsSubtitle}
        </p>
        {/* Metadato de última actualización */}
        <span className="font-sans text-xs text-brand-text-muted mt-1">
          {t.legal.lastUpdated}
        </span>
      </section>

      {/* Cláusulas Legales en Tarjetas Broadsheet */}
      <div className="flex flex-col gap-6">
        {/* Sección 1 */}
        <IncidentCard padding="md">
          <h2 className="font-serif text-xl font-bold text-brand-navy-dark mb-2">
            {t.legal.termsSection1Title}
          </h2>
          <p className="font-sans text-sm text-brand-text-desc leading-relaxed">
            {t.legal.termsSection1Body}
          </p>
        </IncidentCard>

        {/* Sección 2: El Buen Samaritano. Énfasis tipográfico en texto Navy Dark */}
        <IncidentCard padding="md">
          <h2 className="font-serif text-xl font-bold text-brand-navy-dark mb-2">
            {t.legal.termsSection2Title}
          </h2>
          <p className="font-sans text-sm text-brand-navy-dark leading-relaxed font-semibold">
            {t.legal.termsSection2Body}
          </p>
        </IncidentCard>

        {/* Sección 3 */}
        <IncidentCard padding="md">
          <h2 className="font-serif text-xl font-bold text-brand-navy-dark mb-2">
            {t.legal.termsSection3Title}
          </h2>
          <p className="font-sans text-sm text-brand-text-desc leading-relaxed">
            {t.legal.termsSection3Body}
          </p>
        </IncidentCard>

        {/* Sección 4 */}
        <IncidentCard padding="md">
          <h2 className="font-serif text-xl font-bold text-brand-navy-dark mb-2">
            {t.legal.termsSection4Title}
          </h2>
          <p className="font-sans text-sm text-brand-text-desc leading-relaxed">
            {t.legal.termsSection4Body}
          </p>
        </IncidentCard>
      </div>

      <IncidentHairline variant="subtle" />

      {/* Navegación Cruzada hacia Privacidad y Portada */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/privacy" className="btn-neutral">
          {t.common.privacyLink}
        </Link>

        <Link href="/" className="btn-neutral">
          {t.common.backToHome}
        </Link>
      </div>
    </div>
  );
}
