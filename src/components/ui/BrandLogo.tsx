/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes UI Canónicos — Logotipo Oficial Circular
 * ARCHIVO: src/components/ui/BrandLogo.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Logotipo oficial de SAFE en formato circular ("en redondo"). Presenta el emblema
 * tecnológico de escudo, casco aerodinámico y baliza médica coral con encuadre
 * milimétrico, borde perimetral sutil y micro-animación de hover.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ligero ~90 líneas).
 * - Cero textos hardcodeados (consume t vía useLocale si withText=true).
 * - Ergonomía visual de grado aeroespacial / editorial suizo.
 * ==============================================================================
 */

"use client";

import React from "react";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";

export type BrandLogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface BrandLogoProps {
  /** Tamaño del isotipo circular */
  size?: BrandLogoSize;
  /** Variante cromática del aro exterior */
  ringVariant?: "default" | "accent" | "subtle" | "dark";
  /** Si debe incluir la tipografía SAFE y el subtítulo editorial a su derecha */
  withText?: boolean;
  /** Subtítulo personalizado opcional cuando withText=true */
  subtitle?: string;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
}

const SIZE_CLASSES: Record<BrandLogoSize, string> = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
  "2xl": "w-24 h-24",
};

const RING_CLASSES: Record<NonNullable<BrandLogoProps["ringVariant"]>, string> = {
  default: "ring-2 ring-brand-navy-dark/15 shadow-sm",
  accent: "ring-2 ring-brand-accent/70 shadow-md shadow-brand-accent/10",
  subtle: "ring-1 ring-brand-border-strong/60 shadow-sm",
  dark: "ring-2 ring-white/20 shadow-md",
};

export function BrandLogo({
  size = "md",
  ringVariant = "default",
  withText = false,
  subtitle,
  className = "",
}: BrandLogoProps) {
  const { t } = useLocale();
  const sizeClass = SIZE_CLASSES[size];
  const ringClass = RING_CLASSES[ringVariant];

  const logoImage = (
    <div
      className={`relative rounded-full overflow-hidden bg-brand-navy-dark flex-shrink-0 select-none ${sizeClass} ${ringClass} ${className}`}
    >
      <Image
        src="/branding/safe-logo-dark.jpg"
        alt="SAFE — Medical Protection Network"
        fill
        sizes="(max-width: 768px) 48px, 96px"
        priority
        className="object-cover scale-[1.38] -translate-y-[8%] transition-transform duration-300 group-hover:scale-[1.46]"
      />
    </div>
  );

  if (!withText) {
    return logoImage;
  }

  return (
    <div className="flex items-center gap-3 min-w-0">
      {logoImage}
      <div className="flex flex-col min-w-0">
        <span className="font-serif font-bold text-xl md:text-2xl tracking-tight text-brand-navy-dark leading-none group-hover:text-brand-navy-secondary transition-colors truncate">
          {t.common.appName}
        </span>
        <span className="font-sans text-[10px] md:text-[11px] font-semibold text-brand-text-muted tracking-wider uppercase mt-0.5 truncate">
          {subtitle || t.nav.brandSubtitle}
        </span>
      </div>
    </div>
  );
}
