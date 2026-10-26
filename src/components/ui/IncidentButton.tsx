/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Atómicos Incident — Botón Neutro Canónico
 * ARCHIVO: src/components/ui/IncidentButton.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Botón interactivo principal del sistema de diseño Incident.
 * Por defecto es neutro (fondo concreto #efefef, borde capilar negro #000000,
 * radio estricto de 4px y tipografía Arial 13px). Integra retroalimentación
 * háptica automática (useHaptic) y área táctil mínima de 44x44px.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero gradientes o colores saturados de fondo.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useHaptic, type HapticPattern } from "@/hooks/useHaptic";

export interface IncidentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "neutral" | "emergency" | "paper" | "danger";
  size?: "sm" | "md" | "lg";
  haptic?: HapticPattern;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const IncidentButton = React.forwardRef<
  HTMLButtonElement,
  IncidentButtonProps
>(
  (
    {
      children,
      variant = "neutral",
      size = "md",
      haptic = "light",
      icon,
      isLoading = false,
      disabled,
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    const { triggerHaptic } = useHaptic();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;
      triggerHaptic(haptic);
      if (onClick) {
        onClick(e);
      }
    };

    // Estilos por variante oficial SAFE 2026
    let variantStyles =
      "bg-brand-white text-brand-navy-dark border-brand-border-subtle hover:bg-brand-bg-alt hover:border-brand-border-strong shadow-xs";
    if (variant === "emergency") {
      variantStyles =
        "bg-brand-navy-dark text-white border-transparent hover:bg-brand-navy-secondary shadow-sm";
    } else if (variant === "paper") {
      variantStyles =
        "bg-brand-white text-brand-navy-dark border-brand-border-subtle hover:bg-brand-bg-alt hover:border-brand-border-strong shadow-xs";
    } else if (variant === "danger") {
      variantStyles =
        "bg-brand-accent text-white border-transparent hover:bg-brand-accent-hover shadow-sm";
    }

    // Altura y espaciado mínimo para ergonomía móvil (objetivo táctil ≥ 44x44px en TODOS los tamaños)
    let sizeStyles = "min-h-[44px] px-4 py-2 text-xs font-semibold";
    if (size === "sm") {
      sizeStyles = "min-h-[44px] px-3 py-1.5 text-xs font-medium";
    } else if (size === "lg") {
      sizeStyles = "min-h-[48px] px-6 py-3 text-sm font-bold";
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        // Estado de accesibilidad explícito: el botón queda inerte durante la carga o inhabilitación
        aria-disabled={disabled || isLoading || undefined}
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center gap-2
          font-sans rounded-lg border
          select-none cursor-pointer transition-all duration-150
          active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed
          disabled:active:scale-100 min-w-[44px]
          ${variantStyles}
          ${sizeStyles}
          ${className}
        `}
        {...props}
      >
        {/* Indicador de carga: anillo CSS animado puro (borde + spin), sin texto hardcodeado */}
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon && <span className="flex-shrink-0">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

IncidentButton.displayName = "IncidentButton";
