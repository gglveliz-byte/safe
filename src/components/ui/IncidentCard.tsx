/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Atómicos Incident — Tarjeta de Estado (Paper Card)
 * ARCHIVO: src/components/ui/IncidentCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Superficie contenedora principal. Fondo blanco (#ffffff) sobre lienzo concreto
 * (#efefef), radio estricto de 12px, borde capilar negro o cromático según el estado
 * y sombra tenue ultraligera de 2% a 4%.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero esquinas tipo píldora (radio máximo 12px).
 * ==============================================================================
 */

import React from "react";

export interface IncidentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "emergency" | "warning" | "subtle";
  padding?: "sm" | "md" | "lg";
}

export function IncidentCard({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: IncidentCardProps) {
  // Bordes y superficies según el estado oficial SAFE 2026
  let borderStyles = "border-brand-border-subtle bg-brand-white";
  if (variant === "emergency") {
    borderStyles = "border-brand-accent/40 bg-brand-white";
  } else if (variant === "warning") {
    borderStyles = "border-brand-accent-hover/40 bg-brand-white";
  } else if (variant === "subtle") {
    borderStyles = "border-brand-border-subtle bg-brand-bg-alt";
  }

  // Padding ergonómico canónico: sm=16px, md=20-24px, lg=28-32px
  let paddingStyles = "p-5 sm:p-6";
  if (padding === "sm") {
    paddingStyles = "p-4";
  } else if (padding === "lg") {
    paddingStyles = "p-7 sm:p-8";
  }

  return (
    <div
      className={`
        text-brand-navy-dark rounded-xl border
        shadow-sm transition-all duration-150
        ${borderStyles}
        ${paddingStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
