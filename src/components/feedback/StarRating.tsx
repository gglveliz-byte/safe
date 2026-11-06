/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: UI de Autor — Calificación por Estrellas Vectorial / Canvas (Sin Emojis)
 * ARCHIVO: src/components/feedback/StarRating.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente de calificación de 5 estrellas con vectores SVG geométricos puros
 * y micro-animaciones táctiles. CERO emojis.
 *
 * Admite modo interactivo (hover/tap para seleccionar nota de 1 a 5) y modo
 * estático de solo lectura para el carrusel de testimonios.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero emojis; vectores SVG matemáticos con colores de alta gama.
 * - Accesibilidad táctil (≥44px en interactivo) y teclado.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";

export interface StarRatingProps {
  value: number; // 1 a 5
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { icon: "w-4 h-4", gap: "gap-1", touch: "min-h-[28px] min-w-[28px]" },
  md: { icon: "w-6 h-6", gap: "gap-1.5", touch: "min-h-[44px] min-w-[44px]" },
  lg: { icon: "w-8 h-8", gap: "gap-2", touch: "min-h-[48px] min-w-[48px]" },
};

/**
 * Estrella geométrica de 5 puntas de trazo fino y relleno de alta gama.
 */
function StarIcon({
  filled,
  className = "",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? "1" : "1.75"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-150 ${className}`}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  className = "",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const activeRating = hoverValue ?? value;
  const sizeConfig = SIZES[size];

  if (readOnly) {
    return (
      <div
        className={`inline-flex items-center ${sizeConfig.gap} ${className}`}
        aria-label={`Calificación: ${value} de 5 estrellas`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            filled={star <= value}
            className={`${sizeConfig.icon} ${
              star <= value
                ? "text-amber-500 fill-amber-400 drop-shadow-[0_1px_3px_rgba(245,158,11,0.35)]"
                : "text-slate-300 fill-slate-100"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Selecciona una calificación de 1 a 5 estrellas"
      className={`inline-flex items-center ${sizeConfig.gap} ${className}`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= activeRating;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className={`flex items-center justify-center ${sizeConfig.touch} rounded-lg text-slate-300 hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer transition-transform active:scale-95`}
          >
            <StarIcon
              filled={isFilled}
              className={`${sizeConfig.icon} ${
                isFilled
                  ? "text-amber-500 fill-amber-400 drop-shadow-[0_2px_6px_rgba(245,158,11,0.45)] scale-110"
                  : "text-slate-300 hover:text-amber-400"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

