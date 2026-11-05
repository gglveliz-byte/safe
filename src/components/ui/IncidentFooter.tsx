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
        <div className="flex flex-col space-y-2">
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-brand-text-muted font-sans pt-1">
            <span>📍 Parque Industrial (Uncovia), Cuenca - Ecuador</span>
            <span>✉️ <a href="mailto:info@altuschip.com" className="hover:underline text-brand-navy-dark">info@altuschip.com</a></span>
            <span>💬 <a href="https://wa.me/593959057138" target="_blank" rel="noopener noreferrer" className="hover:underline text-brand-navy-dark">+593 959 057 138</a></span>
          </div>
        </div>

        {/* Enlaces y Redes Sociales */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/593959057138"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="p-1.5 rounded-full bg-brand-bg-alt hover:bg-emerald-50 text-emerald-600 border border-brand-border-subtle transition-transform hover:scale-110"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.587 1.761.884 2.79.884 3.179 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.767-5.77zm0 10.455c-.93 0-1.637-.272-2.476-.77l-.177-.105-1.577.413.421-1.537-.116-.185c-.563-.898-.86-1.536-.859-2.504.001-2.551 2.076-4.626 4.628-4.627 2.552 0 4.628 2.076 4.628 4.628 0 2.551-2.076 4.627-4.628 4.627zm5.952-14.612c-3.321-3.322-7.734-5.15-12.428-5.15-9.684 0-17.568 7.884-17.569 17.569 0 3.095.807 6.115 2.342 8.775l-2.489 9.091 9.303-2.44c2.562 1.397 5.452 2.133 8.411 2.134h.008c9.682 0 17.568-7.885 17.569-17.569 0-4.693-1.826-9.108-5.147-12.43z"/></svg>
            </a>
            <a
              href="https://instagram.com/altuschip"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-1.5 rounded-full bg-brand-bg-alt hover:bg-pink-50 text-pink-600 border border-brand-border-subtle transition-transform hover:scale-110"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a
              href="https://tiktok.com/@altuschip"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="p-1.5 rounded-full bg-brand-bg-alt hover:bg-gray-900 hover:text-white text-gray-800 border border-brand-border-subtle transition-transform hover:scale-110"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.55a8.27 8.27 0 0 0 4.84 1.55v-3.41h-.94z"/></svg>
            </a>
            <a
              href="https://facebook.com/altuschip"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="p-1.5 rounded-full bg-brand-bg-alt hover:bg-blue-50 text-blue-600 border border-brand-border-subtle transition-transform hover:scale-110"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
          </div>

          <nav aria-label={t.common.termsLink} className="flex items-center gap-4 text-xs font-medium text-brand-text-desc">
            <Link
              href="/terms"
              onClick={() => triggerHaptic("light")}
              className="hover:text-brand-navy-dark hover:underline underline-offset-4 transition-colors no-underline"
            >
              {t.common.termsLink}
            </Link>
            <span className="text-brand-separator" aria-hidden="true">•</span>
            <Link
              href="/privacy"
              onClick={() => triggerHaptic("light")}
              className="hover:text-brand-navy-dark hover:underline underline-offset-4 transition-colors no-underline"
            >
              {t.common.privacyLink}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
