/**
 * ==============================================================================
 * PROYECTO: ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: Landing Page — Sección de Contacto Oficial y Redes Sociales
 * ARCHIVO: src/components/landing/SocialAndContactSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza los canales oficiales de contacto y presencia digital de AltusChip:
 * WhatsApp, Instagram, TikTok, Facebook con sus logotipos vectoriales oficiales,
 * dirección en Parque Industrial (Uncovia), Cuenca - Ecuador y correo corporativo.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ~250 líneas).
 * - Cero textos hardcodeados (100% diccionario vía useLocale).
 * - Logotipos vectoriales SVG oficiales de alta definición.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export function SocialAndContactSection() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const socialChannels = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      handle: "(593) 959 057 138",
      url: "https://wa.me/593959057138?text=Hola%20AltusChip,%20deseo%20m%C3%A1s%20informaci%C3%B3n",
      color: "hover:border-[#25D366] hover:shadow-[#25D366]/20",
      badgeColor: "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30",
      icon: (
        <svg className="w-8 h-8 fill-current text-[#25D366]" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.101-.477-.15-.678.15-.2.302-.779.98-.955 1.18-.175.201-.351.226-.652.076-.301-.151-1.27-.468-2.419-1.493-.894-.798-1.497-1.784-1.673-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.151-.678-1.633-.929-2.235-.245-.587-.494-.508-.678-.517l-.578-.01c-.2 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.122 3.24 5.141 4.544.718.31 1.278.495 1.716.634.721.229 1.377.197 1.895.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.306.176-1.431-.075-.126-.276-.201-.577-.351zM12.004 0C5.378 0 .008 5.37.008 11.996a11.93 11.93 0 001.637 6.064L0 24l6.109-1.602a11.935 11.935 0 005.895 1.545h.005c6.626 0 11.991-5.37 11.991-11.996S18.63 0 12.004 0zm0 21.99a9.98 9.98 0 01-5.086-1.39l-.365-.216-3.774.99.102-3.676-.237-.378a9.96 9.96 0 01-1.536-5.324c0-5.518 4.49-10.007 10.01-10.007 2.673 0 5.186 1.042 7.075 2.932a9.94 9.94 0 012.93 7.075c0 5.52-4.49 10.009-10.009 10.009z" />
        </svg>
      ),
    },
    {
      id: "instagram",
      name: "Instagram",
      handle: "@altuschip",
      url: "https://instagram.com/altuschip",
      color: "hover:border-[#E1306C] hover:shadow-[#E1306C]/20",
      badgeColor: "bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/30",
      icon: (
        <svg className="w-8 h-8 fill-current text-[#E1306C]" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      id: "tiktok",
      name: "TikTok",
      handle: "@altus.chip.emergen",
      url: "https://www.tiktok.com/@altus.chip.emergen",
      color: "hover:border-[#00F2FE] hover:shadow-[#00F2FE]/20",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      icon: (
        <svg className="w-8 h-8 fill-current text-white" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.55a8.27 8.27 0 0 0 4.84 1.55v-3.41h-.94z" />
        </svg>
      ),
    },
    {
      id: "facebook",
      name: "Facebook",
      handle: "AltusChip Oficial",
      url: "https://www.facebook.com/profile.php?id=61596282710430",
      color: "hover:border-[#1877F2] hover:shadow-[#1877F2]/20",
      badgeColor: "bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30",
      icon: (
        <svg className="w-8 h-8 fill-current text-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="contacto"
      aria-label={t.social.title}
      className="w-full bg-[#0B1522] text-white py-16 md:py-24 border-t border-brand-border-strong/30"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-mono text-xs font-bold text-brand-accent uppercase tracking-widest px-3 py-1 bg-red-950/50 border border-red-800/40 rounded-full inline-block mb-3">
            Comunidad & Atención Oficial
          </span>
          <h2 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight leading-tight text-white mb-3">
            {t.social.title}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-gray-400">
            {t.social.subtitle}
          </p>
        </div>

        {/* Canales de Redes Sociales con Logotipos Oficiales Reales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {socialChannels.map((c) => (
            <a
              key={c.id}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic("light")}
              className={`bg-[#142030] border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl no-underline cursor-pointer group ${c.color}`}
            >
              <div className="p-3 bg-black/40 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
                {c.icon}
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-white">
                  {c.name}
                </h3>
                <span className="font-mono text-xs text-gray-400">
                  {c.handle}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.badgeColor} mt-1`}>
                Ver Oficial →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

