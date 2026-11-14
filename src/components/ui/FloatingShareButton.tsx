/**
 * ==============================================================================
 * PROYECTO: SAFE / ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: UI Componentes — Botón Flotante de Compartir Web & QR
 * ARCHIVO: src/components/ui/FloatingShareButton.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Botón flotante accesible fijado en la esquina inferior derecha, situado
 * directamente sobre el botón de WhatsApp. Permite desplegar el modal de
 * difusión web y código QR desde cualquier posición de scroll.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ~85 líneas).
 * - CERO emojis: 100% vector SVG oficial.
 * - Táctiles >= 44px con respuesta háptica y accesibilidad de teclado.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export interface FloatingShareButtonProps {
  onClick: () => void;
}

export function FloatingShareButton({ onClick }: FloatingShareButtonProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    triggerHaptic("light");
    onClick();
  };

  return (
    <aside
      aria-label={t.landing.floatingShareTooltip}
      className="fixed bottom-24 right-5 sm:bottom-28 sm:right-6 z-40 flex items-center gap-2 pointer-events-auto"
    >
      {/* Tooltip Editorial Flotante */}
      <div
        className={`hidden sm:flex items-center bg-[#0B1522] text-white border border-brand-border-subtle/50 shadow-xl rounded-full px-3.5 py-1.5 text-xs font-sans font-medium transition-all duration-300 pointer-events-none select-none ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-brand-accent mr-2 animate-pulse" />
        <span>{t.landing.floatingShareTooltip}</span>
      </div>

      {/* Botón Circular Principal */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={t.landing.floatingShareTooltip}
        className="relative group w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-navy-dark hover:bg-brand-navy-secondary text-white border-2 border-brand-border-strong active:scale-95 transition-all duration-200 shadow-xl flex items-center justify-center cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand-nav-blue/40"
      >
        {/* Baliza sutil en hover */}
        <span
          className="absolute -inset-1 rounded-full bg-brand-navy-dark/40 opacity-0 group-hover:opacity-100 group-hover:animate-ping pointer-events-none"
          aria-hidden="true"
        />

        {/* Icono Vectorial Oficial de Compartir (Nodos de Red y Flecha) */}
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-brand-accent transition-colors duration-200 relative z-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>
    </aside>
  );
}
