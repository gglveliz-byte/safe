/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Insignia Clínica de Alto Contraste Solar
 * ARCHIVO: src/components/medical/MedicalBadge.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Bloque de visualización clínica de alta legibilidad bajo luz solar directa.
 * Presenta datos críticos (Grupo Sanguíneo, Alergias Severas, Identificación)
 * con tipografía de alto contraste (Times negrita 24px/32px) y borde capilar
 * para lectura inmediata a distancia por parte de paramédicos.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Alto contraste exigido por la skill safe-mobile-native-feel.
 * ==============================================================================
 */

import React from "react";

export interface MedicalBadgeProps {
  label: string;
  value: string;
  isCritical?: boolean;
  isWarning?: boolean;
  className?: string;
}

export function MedicalBadge({
  label,
  value,
  isCritical = false,
  isWarning = false,
  className = "",
}: MedicalBadgeProps) {
  let borderClass = "border-ink";
  let bgClass = "bg-paper";
  let textClass = "text-ink";

  if (isCritical) {
    borderClass = "border-alert-red border-2";
    bgClass = "bg-white";
    textClass = "text-alert-red";
  } else if (isWarning) {
    borderClass = "border-ember border-2";
    bgClass = "bg-white";
    textClass = "text-ember";
  }

  return (
    <div
      className={`
        rounded-[8px] border p-4 sm:p-5 flex flex-col justify-between
        shadow-sm ${borderClass} ${bgClass} ${className}
      `}
    >
      <span className="font-sans text-micro uppercase tracking-wider text-carbon font-semibold mb-1">
        {label}
      </span>
      <span
        className={`font-serif text-heading-sm sm:text-heading font-bold leading-none break-words ${textClass}`}
      >
        {value}
      </span>
    </div>
  );
}
