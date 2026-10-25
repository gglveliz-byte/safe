/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI Incident — Pie de Página Institucional (Legal Broadsheet)
 * ARCHIVO: src/components/ui/IncidentFooter.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Pie de página sobrio y editorial sobre concreto (#efefef) con borde superior
 * capilar negro. Provee enlaces permanentes a las páginas legales obligatorias
 * (/terms y /privacy) con área táctil mínima de 44px, la declaración de derechos
 * reservados con el año en curso calculado dinámicamente y la versión del
 * protocolo, todo en microtipografía Arial. Export SIN props: el layout raíz
 * lo consume como <IncidentFooter />.
 *
 * ENTRADAS: diccionario bilingüe vía useLocale; año del reloj del sistema.
 * SALIDAS: navegación a las vistas legales oficiales.
 * DEPENDENCIAS: useLocale, useHaptic, next/link.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero textos hardcodeados (100% t vía useLocale; año dinámico).
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export function IncidentFooter() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Año en curso calculado dinámicamente (nunca hardcodeado)
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-ink bg-concrete pb-[max(32px,env(safe-area-inset-bottom))] pt-8 text-ink">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 md:flex-row md:gap-6">
        {/* Identidad, año en curso y protocolo del sistema (micro Arial) */}
        <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
          <div className="flex items-center gap-2 font-sans text-micro">
            <span className="font-serif text-body font-bold text-ink">
              {t.common.appName}
            </span>
            <span className="text-mist" aria-hidden="true">
              /
            </span>
            <span className="text-carbon">{t.common.systemVersion}</span>
          </div>
          <p className="font-sans text-micro text-carbon">
            {"©"} {currentYear} {t.common.appName}. {t.common.allRightsReserved}
          </p>
        </div>

        {/* Enlaces legales permanentes con área táctil mínima de 44px */}
        <nav className="flex flex-wrap items-center justify-center font-sans text-micro">
          <Link
            href="/terms"
            onClick={() => triggerHaptic("light")}
            className="inline-flex min-h-[44px] items-center px-2 text-ink underline decoration-ink underline-offset-4 transition-colors hover:text-signal-orange"
          >
            {t.common.termsLink}
          </Link>

          <span className="text-mist" aria-hidden="true">
            •
          </span>

          <Link
            href="/privacy"
            onClick={() => triggerHaptic("light")}
            className="inline-flex min-h-[44px] items-center px-2 text-ink underline decoration-ink underline-offset-4 transition-colors hover:text-signal-orange"
          >
            {t.common.privacyLink}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
