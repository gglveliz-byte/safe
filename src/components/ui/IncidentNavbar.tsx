/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI Incident — Barra de Navegación Institucional
 * ARCHIVO: src/components/ui/IncidentNavbar.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Encabezado broadsheet oficial de la plataforma sobre barra de papel (#ffffff)
 * con borde inferior capilar negro, posición sticky y respeto de la muesca móvil
 * (safe-area-inset-top). Presenta la marca SAFE con la baliza Signal Orange
 * (#f25533), los enlaces oficiales (inicio, ingreso del piloto y ancla al
 * formulario real de activación de la portada) y el conmutador de idioma ES/EN
 * de un solo toque. Export SIN props: el layout raíz la consume como
 * <IncidentNavbar />.
 *
 * ENTRADAS: diccionario bilingüe y conmutador vía useLocale.
 * SALIDAS: navegación interna (/, /login, /#activar) y cambio de idioma.
 * DEPENDENCIAS: useLocale, useHaptic, next/link.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero textos en duro (consumo de t vía useLocale) y cero folios inventados.
 * - Objetivos táctiles mínimos de 44x44px.
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export function IncidentNavbar() {
  const { t, locale, toggleLocale } = useLocale();
  const { triggerHaptic } = useHaptic();

  /** Conmuta el idioma ES/EN en un toque con confirmación háptica sutil. */
  const handleLanguageSwitch = () => {
    triggerHaptic("light");
    toggleLocale();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-ink bg-paper pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        {/* Marca editorial: baliza Signal Orange + nombre oficial + subtítulo micro */}
        <Link
          href="/"
          onClick={() => triggerHaptic("light")}
          className="flex min-h-[44px] select-none items-center gap-2.5 no-underline"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[4px] bg-ink">
            <span className="h-3 w-3 rounded-full bg-signal-orange" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-heading-sm font-bold tracking-tight text-ink">
              {t.common.appName}
            </span>
            <span className="mt-0.5 hidden font-sans text-[11px] uppercase tracking-wider text-carbon sm:block">
              {t.nav.brandSubtitle}
            </span>
          </span>
        </Link>

        {/* Enlaces oficiales y conmutador de idioma (nunca folios de demostración) */}
        <nav className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            onClick={() => triggerHaptic("light")}
            className="btn-neutral text-micro no-underline"
          >
            {t.nav.home}
          </Link>

          <Link
            href="/login"
            onClick={() => triggerHaptic("light")}
            className="btn-neutral text-micro no-underline"
          >
            {t.nav.login}
          </Link>

          {/* "Activar casco": ancla al formulario REAL de folio de la portada */}
          <Link
            href="/#activar"
            onClick={() => triggerHaptic("light")}
            className="btn-neutral text-micro no-underline"
          >
            {t.nav.activateHelmet}
          </Link>

          {/* Selector de idioma ES/EN: objetivo táctil ≥ 44x44px garantizado */}
          <button
            type="button"
            onClick={handleLanguageSwitch}
            aria-label={t.common.languageToggle}
            className="btn-neutral min-h-[44px] min-w-[44px] text-micro font-bold"
          >
            <span className="text-signal-orange" aria-hidden="true">
              ●
            </span>
            {locale === "es" ? "EN" : "ES"}
          </button>
        </nav>
      </div>
    </header>
  );
}
