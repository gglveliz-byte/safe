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
  // Bordes según el estado semántico de atención médica
  let borderStyles = "border-ink";
  if (variant === "emergency") {
    borderStyles = "border-alert-red border-2";
  } else if (variant === "warning") {
    borderStyles = "border-ember";
  } else if (variant === "subtle") {
    borderStyles = "border-mist";
  }

  // Padding ergonómico
  let paddingStyles = "p-5 sm:p-6";
  if (padding === "sm") {
    paddingStyles = "p-3 sm:p-4";
  } else if (padding === "lg") {
    paddingStyles = "p-6 sm:p-8";
  }

  return (
    <div
      className={`
        bg-paper text-ink rounded-[12px] border
        shadow-incident transition-shadow duration-150
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
