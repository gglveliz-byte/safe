/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Layout Privado — Barra Superior de las Áreas Cerradas (SAFE 2026)
 * ARCHIVO: src/components/layout/ConsoleTopBar.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Barra de identidad compartida por las dos áreas privadas de SAFE: la consola
 * de administración (/admin) y el panel del conductor (/dashboard).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero enlaces ni textos de la web pública dentro de las áreas privadas.
 * - Cero textos en duro: todo rótulo sale del diccionario bilingüe.
 * - Objetivos táctiles mínimos de 44x44px.
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";

/** Áreas privadas que comparten esta barra. */
export type ConsoleArea = "admin" | "rider";

export interface ConsoleTopBarProps {
  /** Área cerrada que la renderiza. */
  area: ConsoleArea;
}

/**
 * Encabezado sticky de las consolas privadas con diseño editorial broadsheet 2026.
 */
export function ConsoleTopBar({ area }: ConsoleTopBarProps) {
  const { t, locale, toggleLocale } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Rótulo y destino según el área (ambos del diccionario, cero texto en duro).
  const areaLabel = area === "admin" ? t.admin.consoleLabel : t.dashboard.panelLabel;
  const areaHref = area === "admin" ? "/admin" : "/dashboard";

  /** Conmuta ES/EN en un toque con confirmación háptica sutil. */
  const handleLanguageSwitch = () => {
    triggerHaptic("light");
    toggleLocale();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-border-subtle bg-brand-white/95 backdrop-blur-md pt-[env(safe-area-inset-top)] transition-all">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 h-[68px]">
        {/* Identidad: marca SAFE + rótulo del área privada */}
        <Link
          href={areaHref}
          onClick={() => triggerHaptic("light")}
          className="flex min-h-[44px] select-none items-center gap-3 no-underline group"
        >
          <div className="w-8 h-8 bg-brand-navy-dark rounded flex items-center justify-center relative shadow-sm group-hover:bg-brand-navy-secondary transition-colors duration-200">
            <span
              className="w-2.5 h-2.5 rounded-full bg-brand-accent group-hover:scale-125 transition-transform duration-200"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl md:text-2xl font-bold tracking-tight text-brand-navy-dark leading-none group-hover:text-brand-navy-secondary transition-colors">
              {t.common.appName}
            </span>
            <span className="mt-0.5 font-sans text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-brand-text-muted">
              {areaLabel}
            </span>
          </div>
        </Link>

        {/* Utilidades: idioma y cierre de sesión */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleLanguageSwitch}
            aria-label={t.common.languageToggle}
            className="min-h-[40px] px-3 py-1 text-xs font-semibold text-brand-text-muted hover:text-brand-navy-dark border border-brand-border-subtle rounded hover:border-brand-border-strong hover:bg-brand-bg-alt transition-all duration-150 active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" aria-hidden="true" />
            {locale === "es" ? "EN" : "ES"}
          </button>

          <button
            type="button"
            onClick={() => apiClient.logout()}
            className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-brand-text-desc hover:text-brand-navy-dark border border-brand-border-subtle rounded-md hover:bg-brand-bg-alt hover:border-brand-border-strong active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>🚪</span>
            <span>{t.dashboard.logoutButton}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
