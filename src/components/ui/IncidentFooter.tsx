/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI — Pie de Página Institucional (SAFE 2026)
 * ARCHIVO: src/components/ui/IncidentFooter.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pie de página institucional editorial broadsheet 2026. Muestra la edición oficial,
 * copyright dinámico sin hardcoding y enlaces permanentes a Términos del Servicio
 * y Política de Privacidad de Datos Médicos con área táctil accesible mínima de 44px.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 100 líneas).
 * - Cero textos hardcodeados (100% t vía useLocale; año dinámico).
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function IncidentFooter() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Año calculado dinámicamente
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border-subtle bg-brand-white py-10 md:py-12 mt-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Identidad Editorial y Derechos de Autor */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="xs" />
            <span className="font-serif font-bold text-base text-brand-navy-dark">
              {t.common.appName}
            </span>
            <span className="text-xs text-brand-text-muted">/</span>
            <span className="text-xs font-sans text-brand-text-muted">
              {t.common.systemVersion}
            </span>
          </div>
          <p className="text-xs text-brand-text-muted font-sans">
            {"©"} {currentYear} {t.common.appName}. {t.common.allRightsReserved}
          </p>
        </div>

        {/* Enlaces Legales Permanentes */}
        <nav aria-label={t.common.termsLink} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Link
            href="/terms"
            onClick={() => triggerHaptic("light")}
            className="text-xs font-medium text-brand-text-desc hover:text-brand-navy-dark hover:underline underline-offset-4 transition-colors no-underline"
          >
            {t.common.termsLink}
          </Link>
          <span className="hidden sm:inline text-brand-separator" aria-hidden="true">
            •
          </span>
          <Link
            href="/privacy"
            onClick={() => triggerHaptic("light")}
            className="text-xs font-medium text-brand-text-desc hover:text-brand-navy-dark hover:underline underline-offset-4 transition-colors no-underline"
          >
            {t.common.privacyLink}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
