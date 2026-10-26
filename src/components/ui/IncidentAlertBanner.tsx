/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes Atómicos Incident — Banner Crítico de Emergencia
 * ARCHIVO: src/components/ui/IncidentAlertBanner.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Banner institucional para llamadas de atención prioritarias (alerta médica activa,
 * advertencia de GPS o avisos de ruta). Lavado tintado al 8% de opacidad,
 * borde de 1px en Alert Red (#ff492c) o Ember (#f1641e), y radio de 8px.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero fondos de alerta con gradientes o colores cegadores.
 * ==============================================================================
 */

import React from "react";

export interface IncidentAlertBannerProps {
  type?: "emergency" | "warning" | "info";
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function IncidentAlertBanner({
  type = "emergency",
  title,
  message,
  icon,
  action,
  className = "",
}: IncidentAlertBannerProps) {
  let containerStyles = "bg-brand-accent/5 border-brand-accent/30 text-brand-navy-dark";
  let defaultIconColor = "text-brand-accent";

  if (type === "warning") {
    containerStyles = "bg-amber-50/70 border-amber-300 text-brand-navy-dark";
    defaultIconColor = "text-amber-600";
  } else if (type === "info") {
    containerStyles = "bg-brand-nav-active border-brand-border-subtle text-brand-navy-dark";
    defaultIconColor = "text-brand-nav-blue";
  }

  return (
    <div
      role="alert"
      className={`
        rounded-xl border p-4 sm:p-5
        flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
        ${containerStyles}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="flex-shrink-0 mt-0.5">{icon}</span>
        ) : (
          // Icono por defecto: triángulo de advertencia SVG inline trazado con el color semántico
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`flex-shrink-0 mt-0.5 w-5 h-5 ${defaultIconColor}`}
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
        <div className="flex flex-col">
          {title && (
            <h4 className="font-serif font-bold text-sm sm:text-base text-brand-navy-dark leading-tight mb-1">
              {title}
            </h4>
          )}
          <p className="font-sans text-xs sm:text-sm text-brand-text-desc leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {action && (
        <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          {action}
        </div>
      )}
    </div>
  );
}
