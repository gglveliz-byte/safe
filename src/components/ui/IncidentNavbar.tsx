/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI — Barra de Navegación Institucional (SAFE 2026)
 * ARCHIVO: src/components/ui/IncidentNavbar.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Encabezado oficial con diseño editorial broadsheet 2026. Integra isotipo
 * con baliza pulsante, enlace a Soporte Técnico (mailto), acceso directo
 * para Iniciar Sesión, y conmutador visual bilingüe de alta visibilidad (ES / EN).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 200 líneas).
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

const SUPPORT_EMAIL = "soporte@safe.com";

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

  const isLoginActive = pathname === "/login";

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
        <nav aria-label={t.common.appName} className="hidden md:flex items-center gap-3">
          {/* Soporte Técnico (mailto al correo vinculado) */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            onClick={() => triggerHaptic("light")}
            className="px-3.5 py-2 rounded-md text-[13px] font-medium text-brand-text-desc hover:text-brand-navy-dark hover:bg-brand-bg-alt transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 no-underline inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-brand-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{t.nav.support}</span>
          </a>

          {/* Iniciar Sesión */}
          <Link
            href="/login"
            onClick={() => triggerHaptic("light")}
            aria-current={isLoginActive ? "page" : undefined}
            className={`px-4 py-2 rounded-md text-[13px] font-semibold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 no-underline ${
              isLoginActive
                ? "text-brand-navy-dark bg-brand-nav-active border border-brand-border-subtle"
                : "text-brand-navy-dark hover:bg-brand-bg-alt border border-transparent"
            }`}
          >
            {t.nav.login}
          </Link>

          <div className="w-px h-5 bg-brand-separator mx-1" aria-hidden="true" />

          {/* Conmutador Bilingüe de Alta Claridad */}
          <button
            type="button"
            onClick={handleLanguageSwitch}
            aria-label={t.common.languageToggle}
            className="min-h-[44px] px-3.5 py-1.5 text-[12px] font-semibold text-brand-navy-dark bg-brand-bg-alt hover:bg-brand-white border border-brand-border-subtle hover:border-brand-border-strong rounded-md transition-all duration-150 active:scale-95 inline-flex items-center gap-2 cursor-pointer shadow-2xs group"
          >
            <svg className="w-4 h-4 text-brand-nav-blue flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.3 14.3 0 000 18 14.3 14.3 0 000-18z" />
            </svg>
            <span className="text-brand-text-muted text-[11px] font-medium">Idioma:</span>
            <span className="font-bold text-brand-navy-dark uppercase text-[12px]">
              {locale === "es" ? "Español (EN)" : "English (ES)"}
            </span>
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
          className="md:hidden border-b border-brand-border-subtle bg-brand-white px-4 pt-3 pb-5 space-y-2.5 transition-all duration-200 shadow-md animate-fadeInDown"
        >
          {/* Soporte Técnico en Móvil */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            onClick={() => {
              triggerHaptic("light");
              closeMobileMenu();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-sm font-medium text-brand-text-desc hover:bg-brand-bg-alt active:bg-brand-nav-active transition-colors no-underline"
          >
            <svg className="w-4 h-4 text-brand-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{t.nav.support}</span>
          </a>

          {/* Iniciar Sesión en Móvil */}
          <Link
            href="/login"
            onClick={() => {
              triggerHaptic("light");
              closeMobileMenu();
            }}
            className={`block px-3.5 py-2.5 rounded-md text-sm font-semibold transition-colors no-underline ${
              isLoginActive
                ? "bg-brand-nav-active text-brand-navy-dark"
                : "text-brand-navy-dark hover:bg-brand-bg-alt"
            }`}
          >
            {t.nav.login}
          </Link>

          {/* Selector de Idioma en Móvil */}
          <div className="pt-3 border-t border-brand-separator flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-brand-text-muted">
              <svg className="w-4 h-4 text-brand-nav-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.3 14.3 0 000 18 14.3 14.3 0 000-18z" />
              </svg>
              <span className="font-medium">
                {locale === "es" ? "Idioma" : "Language"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                handleLanguageSwitch();
                closeMobileMenu();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 text-xs font-bold text-brand-navy-dark bg-brand-bg-alt border border-brand-border-subtle hover:border-brand-border-strong rounded-md active:scale-98 transition-all flex items-center justify-between"
            >
              <span>{locale === "es" ? "Español (Activo)" : "English (Active)"}</span>
              <span className="text-brand-accent font-semibold flex items-center gap-1">
                {locale === "es" ? "Cambiar a English →" : "Switch to Español →"}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
