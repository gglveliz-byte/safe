/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI Incident — Pie de Página Institucional (Legal Broadsheet)
 * ARCHIVO: src/components/ui/IncidentFooter.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pie de página sobrio y editorial. Provee enlaces directos y permanentes a las
 * páginas legales obligatorias (/terms, /privacy), acceso al centro de emisión
 * (/admin) y declaración de derechos reservados y versión de protocolo.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero textos hardcodeados.
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";

export function IncidentFooter() {
  const { t } = useLocale();

  return (
    <footer className="w-full bg-concrete border-t border-ink mt-auto py-8 text-ink select-none">
      <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Identidad y Protocolo */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-body text-ink">SAFE</span>
            <span className="text-mist">/</span>
            <span className="font-sans text-micro text-carbon">{t.common.systemVersion}</span>
          </div>
          <p className="font-sans text-[12px] text-carbon mt-1">
            {t.common.allRightsReserved}
          </p>
        </div>

        {/* Enlaces Legales y de Administración */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-micro font-sans">
          <Link
            href="/terms"
            className="text-ink hover:text-signal-orange underline transition-colors"
          >
            {t.common.termsLink}
          </Link>

          <span className="text-mist">•</span>

          <Link
            href="/privacy"
            className="text-ink hover:text-signal-orange underline transition-colors"
          >
            {t.common.privacyLink}
          </Link>

          <span className="text-mist">•</span>

          <Link
            href="/admin"
            className="text-carbon hover:text-ink transition-colors"
          >
            {t.common.adminPanel}
          </Link>
        </div>
      </div>
    </footer>
  );
}
