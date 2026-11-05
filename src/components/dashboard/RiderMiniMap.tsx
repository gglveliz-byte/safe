/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Dashboard — Mini Mapa de Telemetría GPS del Motociclista
 * ARCHIVO: src/components/dashboard/RiderMiniMap.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente modular de mapa compacto Google Maps interactivo para el panel
 * del conductor. Muestra la ubicación exacta de la motocicleta en tiempo real
 * (o su último punto satelital registrado) replicando la estética oficial de la
 * landing: conmutador rápido entre Callejero y Satelital HD, enlace directo
 * a Google Maps y estado de espera con botón de geolocalización.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (componente compacto ~180 líneas).
 * - Cero textos hardcodeados: 100% diccionario tipado vía useLocale.
 * - Cero datos simulados: coordenadas dinámicas reales del piloto.
 * - Estética Incident Broadsheet 2026.
 * ==============================================================================
 */

"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export interface RiderMiniMapProps {
  /** Coordenadas satelitales actuales o últimas registradas del piloto */
  coords: { lat: number; lng: number } | null;
  /** Indica si el Modo Ruta en Carretera está activo con transmisión en vivo */
  isLiveRideActive: boolean;
  /** Callback opcional para solicitar ubicación GPS si aún no hay coordenadas */
  onLocate?: () => void;
  /** Clase CSS adicional opcional */
  className?: string;
}

export function RiderMiniMap({
  coords,
  isLiveRideActive,
  onLocate,
  className = "",
}: RiderMiniMapProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");
  const [isLoading, setIsLoading] = useState(true);

  // Redondeo a 4 decimales (~11m) para estabilizar la URL del iframe ante fluctuaciones menores de GPS
  const roundedLat = coords ? coords.lat.toFixed(4) : null;
  const roundedLng = coords ? coords.lng.toFixed(4) : null;

  const embedUrl = useMemo(() => {
    if (!roundedLat || !roundedLng) return "";
    const typeParam = mapMode === "satellite" ? "k" : "m";
    return `https://maps.google.com/maps?q=${roundedLat},${roundedLng}&t=${typeParam}&z=16&ie=UTF8&iwloc=&output=embed`;
  }, [roundedLat, roundedLng, mapMode]);

  const mapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : "#";

  const handleToggleMode = (mode: "street" | "satellite") => {
    if (mode === mapMode) return;
    triggerHaptic("light");
    setIsLoading(true);
    setMapMode(mode);
  };

  // Estado previo a la obtención de coordenadas satelitales
  if (!coords) {
    return (
      <div className="w-full rounded-xl border border-brand-border-subtle bg-brand-bg-alt p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            🛰️
          </span>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm text-brand-navy-dark">
              {t.dashboard.riderMapWaitingSignal}
            </span>
            <span className="font-sans text-xs text-brand-text-muted">
              {t.dashboard.liveRideDescription}
            </span>
          </div>
        </div>
        {onLocate && (
          <button
            type="button"
            onClick={onLocate}
            className="min-h-[42px] px-4 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
          >
            <span>📍</span>
            <span>{t.dashboard.riderMapLocateBtn}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-xl overflow-hidden border border-brand-border-subtle bg-[#0F1826] shadow-sm flex flex-col ${className}`}
    >
      {/* Barra de control superior compacta estilo cabina de navegación */}
      <div className="w-full bg-[#131E2C] border-b border-gray-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isLiveRideActive ? (
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          ) : (
            <span className="text-xs flex-shrink-0" aria-hidden="true">
              📍
            </span>
          )}
          <span className="font-sans text-xs font-semibold text-gray-200 truncate">
            {isLiveRideActive
              ? t.dashboard.riderMapLive
              : t.dashboard.riderMapLastKnown}
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-gray-400 tracking-wider">
            ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
          </span>
        </div>

        {/* Controles: Capas (Callejero/Satelital) y Enlaces Externos */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => handleToggleMode("street")}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                mapMode === "street"
                  ? "bg-brand-accent text-white font-semibold shadow-xs"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {t.map3d.toggleStreet}
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("satellite")}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                mapMode === "satellite"
                  ? "bg-brand-accent text-white font-semibold shadow-xs"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {t.map3d.toggleSatellite}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic("light")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1C2F48] hover:bg-[#253D5C] text-[11px] font-semibold text-gray-200 transition-colors border border-gray-700/60 no-underline shadow-xs"
              title={t.dashboard.riderMapOpenMaps}
            >
              <span>Maps</span>
              <span className="text-[9px] text-gray-400">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Contenedor del Iframe con altura compacta para mapa pequeño */}
      <div className="relative w-full h-[200px] sm:h-[230px] bg-[#09111C] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F1826] text-gray-400 gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
            <span className="text-[11px] font-mono">
              {t.dashboard.riderMapLoading}
            </span>
          </div>
        )}

        {embedUrl && (
          <iframe
            key={`${roundedLat}-${roundedLng}-${mapMode}`}
            title="Ubicación GPS Motocicleta SAFE"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIsLoading(false)}
            className="w-full h-full block"
          />
        )}
      </div>
    </div>
  );
}

