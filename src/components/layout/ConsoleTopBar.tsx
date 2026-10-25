/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Layout Privado — Barra Superior de las Áreas Cerradas
 * ARCHIVO: src/components/layout/ConsoleTopBar.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Barra de identidad compartida por las dos áreas privadas de SAFE: la consola
 * de administración (/admin) y el panel del conductor (/dashboard). Ambas son
 * herramientas con sesión iniciada, por lo que NO deben mostrar la navegación
 * pública ("Inicio", "Ingreso Piloto", "Activar mi Casco") ni el pie con
 * enlaces legales. Expone únicamente la marca, el rótulo del área, el
 * conmutador de idioma ES/EN y el cierre de sesión seguro.
 *
 * ENTRADAS: prop `area` ("admin" | "rider") que resuelve rótulo y destino.
 * SALIDAS: header sticky con logout vía apiClient.logout() y cambio de idioma.
 * DEPENDENCIAS: useLocale, useHaptic, apiClient, IncidentButton, next/link.
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
import { IncidentButton } from "@/components/ui/IncidentButton";

/** Áreas privadas que comparten esta barra. */
export type ConsoleArea = "admin" | "rider";

export interface ConsoleTopBarProps {
  /** Área cerrada que la renderiza. */
  area: ConsoleArea;
}

/**
 * Encabezado sticky de las consolas privadas.
 * Sustituye al IncidentNavbar público: sin enlaces de marketing ni footer legal.
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
    <header className="sticky top-0 z-40 w-full border-b border-ink bg-paper pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        {/* Identidad: marca SAFE + rótulo del área privada */}
        <Link
          href={areaHref}
          onClick={() => triggerHaptic("light")}
          className="flex min-h-[44px] select-none items-center gap-2.5 no-underline"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[4px] bg-ink">
            <span
              className="h-3 w-3 rounded-full bg-signal-orange"
              aria-hidden="true"
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-heading-sm font-bold tracking-tight text-ink">
              {t.common.appName}
            </span>
            <span className="mt-0.5 font-sans text-[11px] uppercase tracking-wider text-carbon">
              {areaLabel}
            </span>
          </span>
        </Link>

        {/* Utilidades: idioma y cierre de sesión */}
        <div className="flex flex-wrap items-center justify-end gap-2">
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

          <IncidentButton
            type="button"
            variant="neutral"
            size="sm"
            onClick={() => apiClient.logout()}
          >
            🚪 {t.dashboard.logoutButton}
          </IncidentButton>
        </div>
      </div>
    </header>
  );
}
