/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Médicos — Insignia Clínica de Alto Contraste Solar
 * ARCHIVO: src/components/medical/MedicalBadge.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Bloque de visualización clínica de alta legibilidad bajo luz solar directa,
 * consumido por la ficha pública de emergencia (grupo sanguíneo, alergias
 * severas y demás datos vitales). La severidad se expresa ÚNICAMENTE con el
 * borde sobre papel blanco: crítico (2px rojo alerta), advertencia (2px brasa)
 * o base (1px tinta). El valor clínico siempre va en serif grande y negrita
 * negra para máximo contraste solar, sin colores fuera de la paleta Incident.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero texto hardcodeado: label y value llegan ya traducidos por el consumidor.
 * - Alto contraste exigido por la skill safe-mobile-native-feel (§7).
 * ==============================================================================
 */

import React from "react";

/** Props CONGELADOS de la insignia clínica (la vista de emergencia los usa). */
export interface MedicalBadgeProps {
  /** Etiqueta humana del dato clínico, resuelta con el diccionario bilingüe. */
  label: string;
  /** Valor clínico declarado por el conductor (grupo sanguíneo, alergias...). */
  value: string;
  /** Severidad máxima: borde de 2px en rojo alerta oficial (#ff492c). */
  isCritical?: boolean;
  /** Advertencia secundaria: borde de 2px en naranja brasa oficial (#f1641e). */
  isWarning?: boolean;
  /** Utilidad opcional de maquetación para el consumidor (rejillas, anchos). */
  className?: string;
}

/**
 * Insignia clínica de rescate.
 * isCritical tiene prioridad sobre isWarning cuando ambos llegan activos:
 * el paramédico debe ver primero el riesgo que amenaza la vida.
 */
export function MedicalBadge({
  label,
  value,
  isCritical = false,
  isWarning = false,
  className = "",
}: MedicalBadgeProps) {
  // La severidad solo modifica el grosor y color oficial del borde;
  // el fondo papel y la tinta negra del valor nunca cambian (contraste solar).
  let borderClass = "border border-ink";
  if (isCritical) {
    borderClass = "border-2 border-alert-red";
  } else if (isWarning) {
    borderClass = "border-2 border-ember";
  }

  return (
    <div
      className={`rounded-[8px] ${borderClass} bg-paper p-4 sm:p-5 flex flex-col justify-between shadow-incident ${className}`}
    >
      <span className="font-sans text-micro uppercase tracking-wider text-carbon font-semibold mb-1">
        {label}
      </span>
      <span className="font-serif text-heading-sm sm:text-heading font-bold leading-none break-words text-ink">
        {value}
      </span>
    </div>
  );
}
