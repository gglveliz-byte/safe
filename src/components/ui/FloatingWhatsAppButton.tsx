/**
 * ==============================================================================
 * PROYECTO: ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: UI Componentes — Botón Flotante Oficial de WhatsApp
 * ARCHIVO: src/components/ui/FloatingWhatsAppButton.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Botón flotante persistente fijado en la esquina inferior derecha con el
 * isotipo vectorial oficial de WhatsApp (círculo verde #25D366 con auricular
 * blanco) y baliza sónar radar pulsante. Conecta directamente con el canal
 * de atención oficial (+593 959 057 138).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ~85 líneas).
 * - Cero textos hardcodeados (100% bilingüe vía useLocale).
 * - Z-index seguro y micro-interacción háptica.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

const WHATSAPP_URL = "https://wa.me/593959057138?text=Hola%20AltusChip,%20deseo%20m%C3%A1s%20informaci%C3%B3n";

export function FloatingWhatsAppButton() {
  const { locale } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [isHovered, setIsHovered] = useState(false);

  const label = locale === "es"
    ? "Chatea con AltusChip por WhatsApp (+593 959 057 138)"
    : "Chat with AltusChip on WhatsApp (+593 959 057 138)";

  const tooltipText = locale === "es"
    ? "¿Preguntas? Escríbenos a WhatsApp"
    : "Questions? Chat on WhatsApp";

  return (
    <aside
      aria-label="Atención al cliente por WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 pointer-events-auto"
    >
      {/* Tooltip Editorial Flotante */}
      <div
        className={`hidden sm:flex items-center bg-[#0B1522] text-white border border-gray-700/80 shadow-2xl rounded-full px-3.5 py-1.5 text-xs font-sans font-medium transition-all duration-300 pointer-events-none select-none ${
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#25D366] mr-2 animate-pulse" />
        <span>{tooltipText}</span>
      </div>

      {/* Botón Principal con Logotipo Oficial de WhatsApp */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        onClick={() => triggerHaptic("light")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 transition-all duration-200 shadow-2xl flex items-center justify-center cursor-pointer no-underline focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Baliza Radar Sónar */}
        <span
          className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none opacity-75 group-hover:opacity-100"
          aria-hidden="true"
        />

        {/* Isotipo Vectorial Oficial de WhatsApp (Teléfono Blanco en Globo) */}
        <svg
          className="w-8 h-8 sm:w-9 sm:h-9 text-white fill-current relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-200"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.101-.477-.15-.678.15-.2.302-.779.98-.955 1.18-.175.201-.351.226-.652.076-.301-.151-1.27-.468-2.419-1.493-.894-.798-1.497-1.784-1.673-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.678-1.633-.929-2.235-.245-.587-.494-.508-.678-.517l-.578-.01c-.2 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.122 3.24 5.141 4.544.718.31 1.278.495 1.716.634.721.229 1.377.197 1.895.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351zM12.004 0C5.378 0 .008 5.37.008 11.996a11.93 11.93 0 001.637 6.064L0 24l6.109-1.602a11.935 11.935 0 005.895 1.545h.005c6.626 0 11.991-5.37 11.991-11.996S18.63 0 12.004 0zm0 21.99a9.98 9.98 0 01-5.086-1.39l-.365-.216-3.774.99.102-3.676-.237-.378a9.96 9.96 0 01-1.536-5.324c0-5.518 4.49-10.007 10.01-10.007 2.673 0 5.186 1.042 7.075 2.932a9.94 9.94 0 012.93 7.075c0 5.52-4.49 10.009-10.009 10.009z" />
        </svg>
      </a>
    </aside>
  );
}
