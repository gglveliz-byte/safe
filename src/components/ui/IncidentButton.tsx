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

    // Estilos por variante canónica
    let variantStyles = "bg-concrete text-ink border-ink hover:bg-mist";
    if (variant === "emergency") {
      variantStyles = "bg-ink text-paper border-ink hover:bg-carbon";
    } else if (variant === "paper") {
      variantStyles = "bg-paper text-ink border-ink hover:bg-concrete";
    } else if (variant === "danger") {
      variantStyles = "bg-red-50 text-alert-red border-alert-red hover:bg-red-100";
    }

    // Altura y espaciado mínimo para ergonomía móvil
    let sizeStyles = "min-h-[44px] px-3 py-2 text-micro";
    if (size === "sm") {
      sizeStyles = "min-h-[40px] px-2.5 py-1.5 text-[12px]";
    } else if (size === "lg") {
      sizeStyles = "min-h-[50px] px-5 py-3 text-body font-bold";
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center gap-2
          font-sans font-medium rounded-[4px] border
          select-none cursor-pointer transition-all duration-75
          active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed
          disabled:active:scale-100 min-w-[44px]
          ${variantStyles}
          ${sizeStyles}
          ${className}
        `}
        {...props}
      >
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
