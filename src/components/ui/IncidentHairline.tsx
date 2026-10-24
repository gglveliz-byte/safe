/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Atómicos Incident — Línea Divisoria Capilar (Hairline)
 * ARCHIVO: src/components/ui/IncidentHairline.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Separador estructural de 1px. Provee división sobria entre secciones editoriales
 * broadsheet sin saturar la composición visual.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * ==============================================================================
 */

import React from "react";

export interface IncidentHairlineProps {
  variant?: "solid" | "subtle";
  margin?: "sm" | "md" | "lg";
  className?: string;
}

export function IncidentHairline({
  variant = "solid",
  margin = "md",
  className = "",
}: IncidentHairlineProps) {
  const colorClass = variant === "solid" ? "bg-ink" : "bg-mist";

  let marginClass = "my-6";
  if (margin === "sm") {
    marginClass = "my-4";
  } else if (margin === "lg") {
    marginClass = "my-10";
  }

  return (
    <hr
      className={`border-0 h-[1px] w-full ${colorClass} ${marginClass} ${className}`}
    />
  );
}
