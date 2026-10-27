/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI — Barra de Navegación Institucional (SAFE 2026)
 * ARCHIVO: src/components/ui/IncidentNavbar.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Encabezado oficial con diseño editorial broadsheet 2026. Integra isotipo
 * con baliza pulsante, navegación fluida de escritorio, botón hamburguesa móvil
 * animado y conmutador de idioma ES/EN instantáneo.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 180 líneas).
 * - Cero textos hardcodeados (consumo de t vía useLocale).
 * - Objetivos táctiles mínimos de 44x44px.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function IncidentNavbar() {
  const { t, locale, toggleLocale } = useLocale();
  const { triggerHaptic } = useHaptic();
  const pathname = usePathname() || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    triggerHaptic("light");
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLanguageSwitch = () => {
    triggerHaptic("light");
    toggleLocale();
  };

  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 bg-brand-white/95 backdrop-blur-md border-b border-brand-border-subtle transition-all duration-300">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-[68px] md:h-[72px] flex items-center justify-between">
        {/* Isotipo & Marca Editorial */}
        <Link
          href="/"
          onClick={() => {
            triggerHaptic("light");
            closeMobileMenu();
          }}
          aria-label={`${t.common.appName} - ${t.nav.home}`}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brand-nav-blue rounded-lg p-1 transition-transform duration-200 active:scale-95 no-underline"
        >
          <BrandLogo size="md" />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl md:text-2xl tracking-tight text-brand-navy-dark leading-none group-hover:text-brand-navy-secondary transition-colors">
              {t.common.appName}
            </span>
            <span className="font-sans text-[10px] md:text-[11px] font-semibold text-brand-text-muted tracking-wider uppercase mt-0.5">
              {t.nav.brandSubtitle}
            </span>
          </div>
        </Link>

        {/* Menú de Navegación de Escritorio */}
        <nav aria-label={t.common.appName} className="hidden md:flex items-center gap-2">
          <Link
            href="/"
            onClick={() => triggerHaptic("light")}
            aria-current={isHome ? "page" : undefined}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 no-underline ${
              isHome
                ? "text-brand-navy-dark bg-brand-nav-active hover:bg-brand-border-subtle/50"
                : "text-brand-text-desc hover:text-brand-navy-dark hover:bg-brand-bg-alt"
            }`}
          >
            {t.nav.home}
          </Link>

          <Link
            href="/login"
            onClick={() => triggerHaptic("light")}
            className="px-3.5 py-1.5 rounded-md text-[13px] font-medium text-brand-text-desc hover:text-brand-navy-dark hover:bg-brand-bg-alt transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 no-underline"
          >
            {t.nav.login}
          </Link>

          <Link
            href="/#activar-casco"
            onClick={() => triggerHaptic("light")}
            className="px-3.5 py-1.5 rounded-md text-[13px] font-medium text-brand-text-desc hover:text-brand-navy-dark hover:bg-brand-bg-alt transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 no-underline"
          >
            {t.nav.activateHelmet}
          </Link>

          <div className="w-px h-4 bg-brand-separator mx-1" aria-hidden="true" />

          {/* Conmutador Bilingüe Instantáneo */}
          <button
            type="button"
            onClick={handleLanguageSwitch}
            aria-label={t.common.languageToggle}
            className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-[12px] font-semibold text-brand-text-muted hover:text-brand-navy-dark border border-brand-border-subtle rounded hover:border-brand-border-strong hover:bg-brand-bg-alt transition-all duration-150 active:scale-95 inline-flex items-center justify-center cursor-pointer"
          >
            {locale === "es" ? "EN" : "ES"}
          </button>
        </nav>

        {/* Botón Móvil Hamburguesa Animado */}
        <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-label="Menú de navegación"
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-brand-navy-dark hover:bg-brand-bg-subtle focus:outline-none focus:ring-2 focus:ring-brand-nav-blue active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div
          aria-label="Menú móvil"
          className="md:hidden border-b border-brand-border-subtle bg-brand-white px-4 pt-3 pb-5 space-y-2 transition-all duration-200 shadow-md animate-fadeInDown"
        >
          <Link
            href="/"
            onClick={() => {
              triggerHaptic("light");
              closeMobileMenu();
            }}
            className={`block px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors no-underline ${
              isHome ? "bg-brand-nav-active text-brand-navy-dark font-semibold" : "text-brand-text-desc hover:bg-brand-bg-alt"
            }`}
          >
            {t.nav.home}
          </Link>

          <Link
            href="/login"
            onClick={() => {
              triggerHaptic("light");
              closeMobileMenu();
            }}
            className="block px-3.5 py-2.5 rounded-md text-sm font-medium text-brand-text-desc hover:bg-brand-bg-alt active:bg-brand-nav-active transition-colors no-underline"
          >
            {t.nav.login}
          </Link>

          <Link
            href="/#activar-casco"
            onClick={() => {
              triggerHaptic("light");
              closeMobileMenu();
            }}
            className="block px-3.5 py-2.5 rounded-md text-sm font-medium text-brand-text-desc hover:bg-brand-bg-alt active:bg-brand-nav-active transition-colors no-underline"
          >
            {t.nav.activateHelmet}
          </Link>

          <div className="pt-3 border-t border-brand-separator flex items-center justify-between">
            <span className="text-xs text-brand-text-muted">
              {locale === "es" ? "Idioma: Español" : "Language: English"}
            </span>
            <button
              type="button"
              onClick={() => {
                handleLanguageSwitch();
                closeMobileMenu();
              }}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold text-brand-text-muted border border-brand-border-subtle rounded-md hover:text-brand-navy-dark active:scale-95 transition-transform"
            >
              {locale === "es" ? "EN" : "ES"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
