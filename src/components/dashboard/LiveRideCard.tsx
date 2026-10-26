/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Dashboard — Tarjeta de Modo Ruta (WakeLock & Telemetría)
 * ARCHIVO: src/components/dashboard/LiveRideCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente modular táctil para activar y monitorear el 'Modo Ruta' en carretera.
 * Muestra el conmutador visual, el indicador de pantalla despierta (Screen WakeLock API)
 * y la última posición satelital transmitida periódicamente a POST /api/gps/heartbeat.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Estética Incident (concreto, paper, signal orange, botones con borde 1px).
 * - Cero datos hardcodeados.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";

export interface LiveRideCardProps {
  isLiveRideActive: boolean;
  isScreenLocked: boolean;
  lastCoords: { lat: number; lng: number } | null;
  lastHeartbeatTime: string | null;
  onToggle: () => void;
}

export function LiveRideCard({
  isLiveRideActive,
  isScreenLocked,
  lastCoords,
  lastHeartbeatTime,
  onToggle,
}: LiveRideCardProps) {
  const { t } = useLocale();

  return (
    <IncidentCard
      padding="md"
      variant={isLiveRideActive ? "emergency" : "default"}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">
            🏍️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
                {t.dashboard.liveRideTitle}
              </h3>
              {isLiveRideActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-ping" />
              )}
            </div>
            <p className="font-sans text-xs text-brand-text-desc mt-1 max-w-lg">
              {t.dashboard.liveRideDescription}
            </p>
          </div>
        </div>

        <IncidentButton
          type="button"
          variant={isLiveRideActive ? "emergency" : "neutral"}
          size="lg"
          onClick={onToggle}
          className="w-full sm:w-auto min-w-[200px]"
        >
          {isLiveRideActive
            ? `⚡ ${t.dashboard.liveRideActive}`
            : `○ ${t.dashboard.liveRideInactive}`}
        </IncidentButton>
      </div>

      {/* Indicadores de Estado de Pantalla Activa y Satélites */}
      {isLiveRideActive && (
        <div className="p-3.5 bg-brand-bg-alt border border-brand-border-subtle rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-sans">
          <span className="font-semibold text-brand-navy-dark flex flex-wrap items-center gap-2">
            <span className="text-brand-accent" aria-hidden="true">●</span>
            {t.dashboard.liveRideWarning}
            {isScreenLocked && (
              <span className="px-2 py-0.5 bg-brand-navy-dark text-white rounded-md font-sans text-[10px] font-bold uppercase tracking-widest">
                {t.dashboard.wakeLockOn}
              </span>
            )}
          </span>
          {lastCoords && (
            <span className="font-mono tracking-wider text-brand-text-muted text-xs">
              {t.dashboard.satelliteLabel}:{" "}
              {lastCoords.lat.toFixed(5)}, {lastCoords.lng.toFixed(5)}
              {lastHeartbeatTime
                ? ` · ${t.dashboard.lastReportLabel} ${new Date(
                    lastHeartbeatTime,
                  ).toLocaleTimeString()}`
                : ""}
            </span>
          )}
        </div>
      )}

      {/* Consejo de Seguridad y Resiliencia GPS para el Piloto */}
      <div className="p-3.5 bg-brand-nav-active border border-brand-border-subtle rounded-xl flex items-start gap-2.5 text-xs font-sans">
        <span className="text-brand-accent text-base flex-shrink-0" aria-hidden="true">💡</span>
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-brand-navy-dark uppercase tracking-wider">{t.dashboard.liveRideSafetyTip}</span>
          <span className="text-brand-text-desc leading-relaxed">{t.dashboard.liveRideSafetyTipDesc}</span>
        </div>
      </div>
    </IncidentCard>
  );
}
