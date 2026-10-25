/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Landing Page — Tarjeta Visual del Casco con Radares Sónar
 * ARCHIVO: src/components/landing/HelmetHeroCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la fotografía de grado editorial del casco con los dos radares sónar
 * pulsantes (antena NFC y sticker QR) y el pie de estado 'Activo 24/7'.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo < 100 líneas).
 * - Cero texto hardcodeado (consumo de t vía useLocale).
 * ==============================================================================
 */

"use client";

import React from "react";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";

const HELMET_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida/AEtjO1V5KJm4hVi5uWY9xzvTWzA4_ameErdGp8NxTgvOsJXjUMc1BvudOQMttUs2-Tmezrz5eatAypmyJqoFGooWnRClzWu0pUHi8wXQL8mXWqQzyukcm-5L9sVE8fkdiV3VFIE43sgYGIdE6pM1dhCkBiiyVoIVtOMUIGitJ0SqK0j7MP9xNUa8pTldKDZfG0OKTpwPXnc7C0d-fgQ_RpUGDmoyQl9nEiQ3lFLEayfLYsp9y9gE8e8kmBaJofLw";

export function HelmetHeroCard() {
  const { t } = useLocale();

  return (
    <div className="helmet-hero-card relative w-full max-w-[500px] lg:max-w-none rounded-xl overflow-hidden border border-brand-border-subtle bg-brand-bg-alt shadow-sm group">
      {/* Fotografía oficial del casco */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <Image
          src={HELMET_IMAGE_URL}
          alt={t.landing.helmetTagBadge}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 480px"
          priority
          className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.025]"
        />
      </div>

      {/* RADAR BEACON 1: Sobre el sticker QR (Superior Derecho) */}
      <div
        className="absolute top-[32%] right-[27%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="sonar-ring bg-brand-accent/25 border border-brand-accent/40" />
          <div className="sonar-ring sonar-ring-2 bg-brand-accent/20 border border-brand-accent/30" />
          <div className="w-3 h-3 rounded-full bg-brand-accent dot-beacon border-2 border-white/80" />
        </div>
      </div>

      {/* RADAR BEACON 2: Sobre el pod de antena NFC (Inferior Centro-Derecho) */}
      <div
        className="absolute bottom-[20.5%] right-[42%] -translate-x-1/2 translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      >
        <div className="relative w-7 h-7 flex items-center justify-center">
          <div className="sonar-ring bg-brand-nav-blue/30 border border-brand-nav-blue/50" />
          <div className="sonar-ring sonar-ring-2 bg-brand-nav-blue/20 border border-brand-nav-blue/35" />
          <div className="w-2.5 h-2.5 rounded-full bg-brand-nav-blue border-2 border-white/90" />
        </div>
      </div>

      {/* Pie de foto editorial en degradado oscuro */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-brand-navy-dark/90 via-brand-navy-dark/50 to-transparent p-3 sm:p-4 flex items-center justify-between text-white transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-sans tracking-wide uppercase font-medium drop-shadow-sm">
            {t.landing.helmetTagBadge}
          </span>
        </div>
        <span className="text-[9px] sm:text-[10px] bg-brand-accent px-2 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm">
          {t.landing.helmetTagStatus}
        </span>
      </div>
    </div>
  );
}
