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
              <h3 className="font-serif font-bold text-heading-sm text-ink leading-tight">
                {t.dashboard.liveRideTitle}
              </h3>
              {isLiveRideActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-signal-orange animate-ping" />
              )}
            </div>
            <p className="font-sans text-micro text-carbon mt-1 max-w-lg">
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
        <div className="p-3 bg-concrete border border-ink rounded-[6px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-micro font-sans">
          <span className="font-semibold text-ink flex flex-wrap items-center gap-2">
            <span className="text-signal-orange" aria-hidden="true">●</span>
            {t.dashboard.liveRideWarning}
            {/* P-7: rótulo propio del bloqueo de pantalla. Antes reusaba
                `common.emergencyBadge` ("Ficha de Auxilio"), que no describe
                nada de esto; la brecha de diccionario queda cerrada. */}
            {isScreenLocked && (
              <span className="px-2 py-1 bg-ink text-paper rounded-[4px] font-sans text-[11px] font-bold uppercase tracking-widest">
                {t.dashboard.wakeLockOn}
              </span>
            )}
          </span>
          {/* M-4: font-mono erradicado; coordenadas en sans con tracking amplio.
              P-7: la etiqueta técnica "GPS:" se reemplaza por el rótulo humano
              del diccionario. */}
          {lastCoords && (
            <span className="font-sans tracking-widest text-carbon text-[11px]">
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
    </IncidentCard>
  );
}
