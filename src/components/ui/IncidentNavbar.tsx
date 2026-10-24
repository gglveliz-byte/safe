/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI Incident — Barra de Navegación Institucional
 * ARCHIVO: src/components/ui/IncidentNavbar.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Encabezado broadsheet oficial de la plataforma. Presenta el logotipo SAFE
 * con la baliza Signal Orange (#f25533), enlaces de navegación esenciales
 * y el conmutador de idioma ES/EN accesible en un solo toque táctil.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero textos en duro (consumo de t vía useLocale).
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

  const handleLanguageSwitch = () => {
    triggerHaptic("light");
    toggleLocale();
  };

  return (
    <header className="w-full bg-concrete border-b border-ink">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logotipo Editorial SAFE con Baliza Signal Orange */}
        <Link
          href="/"
          className="flex items-center gap-3 select-none no-underline group"
          onClick={() => triggerHaptic("light")}
        >
          <div className="w-8 h-8 rounded-sm bg-ink flex items-center justify-center relative">
            <span className="w-3 h-3 rounded-full bg-signal-orange" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-heading-sm font-bold text-ink tracking-tight leading-none">
              SAFE
            </span>
            <span className="font-sans text-[11px] text-ink font-normal uppercase tracking-wider">
              {t.nav.brandSubtitle}
            </span>
          </div>
        </Link>

        {/* Enlaces de Navegación y Conmutador de Idioma */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/activate/SAFE-DEMO"
            className="hidden sm:inline-flex btn-neutral text-micro"
            onClick={() => triggerHaptic("light")}
          >
            {t.nav.activateHelmet}
          </Link>

          <Link
            href="/dashboard"
            className="btn-neutral text-micro"
            onClick={() => triggerHaptic("light")}
          >
            {t.nav.dashboard}
          </Link>

          {/* Botón Táctil de Conmutación de Idioma (44x44px garantizado) */}
          <button
            type="button"
            onClick={handleLanguageSwitch}
            className="btn-neutral text-micro font-bold px-3 min-w-[44px] min-h-[44px]"
            aria-label="Cambiar idioma / Switch language"
            title="Conmutar idioma (ES / EN)"
          >
            <span className="text-signal-orange font-bold mr-1">●</span>
            {locale === "es" ? "EN" : "ES"}
          </button>
        </nav>
      </div>
    </header>
  );
}
