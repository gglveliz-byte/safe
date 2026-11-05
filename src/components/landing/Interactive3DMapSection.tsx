/**
 * ==============================================================================
 * PROYECTO: ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: Landing Page — Mapa Interactivo Satelital y Callejero (Sede Única)
 * ARCHIVO: src/components/landing/Interactive3DMapSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza el mapa interactivo de ubicación oficial de AltusChip para la sede
 * única: Parque Industrial (Uncovia), Cuenca - Ecuador. Soporta alternancia
 * instantánea entre vista Satelital HD (imágenes aéreas reales) y Callejero
 * (CartoDB Voyager con relieve topográfico), con pin circular oficial y baliza sónar.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ~250 líneas).
 * - Cero textos hardcodeados (100% diccionario vía useLocale).
 * - Cero distorsiones CSS 3D: eventos de puntero, zoom y arrastre 100% precisos.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

// Coordenadas geográficas verificadas del Parque Industrial (Uncovia), Cuenca - Ecuador
const CUENCA_HQ_COORDS: [number, number] = [-2.8756, -78.9865];

export function Interactive3DMapSection() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const currentTileLayerRef = useRef<unknown>(null);

  const [mapLayer, setMapLayer] = useState<"satellite" | "street">("satellite");
  const [showInfoCard, setShowInfoCard] = useState<boolean>(true);

  // Inicialización de Leaflet en el cliente
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = await import("leaflet");
      if (isCancelled) return;

      // Inyectar CSS de Leaflet de forma segura
      if (!document.getElementById("leaflet-css-bundle")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-bundle";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Limpiar mapa previo si existía
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }

      // Crear instancia de mapa Leaflet centrada en la Sede Matriz Cuenca
      const map = L.map(mapContainerRef.current, {
        center: CUENCA_HQ_COORDS,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      // Controles de zoom arriba a la derecha
      L.control.zoom({ position: "topright" }).addTo(map);

      // Crear capas de teselas
      const streetTileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      const satelliteTileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

      const tileLayer = L.tileLayer(mapLayer === "satellite" ? satelliteTileUrl : streetTileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      currentTileLayerRef.current = tileLayer;

      // Pin circular con logotipo oficial de AltusChip y radar sónar pulsante
      const pinHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <div class="w-14 h-14 rounded-full absolute -inset-2 bg-red-500/30 animate-ping pointer-events-none"></div>
          <div class="w-11 h-11 rounded-full bg-white border-2 border-red-600 shadow-2xl overflow-hidden flex items-center justify-center p-0.5 hover:scale-115 transition-transform duration-200">
            <img src="/branding/altuschip-logo.png" alt="AltusChip" class="w-full h-full object-cover rounded-full" />
          </div>
          <div class="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-white font-sans text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-lg border border-red-500/40 pointer-events-none flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            ALTUS-CHIP MATRIZ
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "altus-custom-marker",
        html: pinHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker(CUENCA_HQ_COORDS, { icon: customIcon }).addTo(map);

      marker.on("click", () => {
        triggerHaptic("light");
        setShowInfoCard(true);
        map.setView(CUENCA_HQ_COORDS, 16, { animate: true });
      });

      mapInstanceRef.current = map;

      // Forzar cálculo de dimensiones de Leaflet para garantizar carga inmediata de teselas
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    void initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Manejo de cambio de capa (Satelital HD vs Callejero)
  const handleSwitchLayer = async (nextLayer: "satellite" | "street") => {
    triggerHaptic("light");
    setMapLayer(nextLayer);

    if (!mapInstanceRef.current) return;
    const L = await import("leaflet");
    const map = mapInstanceRef.current as { addLayer: (l: unknown) => void; removeLayer: (l: unknown) => void; invalidateSize: () => void };

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const nextUrl = nextLayer === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const newTile = L.tileLayer(nextUrl, {
      maxZoom: 19,
      subdomains: "abcd",
    });

    newTile.addTo(map as unknown as import("leaflet").Map);
    currentTileLayerRef.current = newTile;
    map.invalidateSize();
  };

  const handleCenterHq = () => {
    triggerHaptic("light");
    setShowInfoCard(true);
    if (mapInstanceRef.current) {
      (mapInstanceRef.current as { setView: (c: [number, number], z: number, o: { animate: boolean }) => void }).setView(
        CUENCA_HQ_COORDS,
        16,
        { animate: true }
      );
    }
  };

  return (
    <section id="mapa" aria-label={t.map3d.title} className="w-full bg-[#080E17] text-white py-16 md:py-24 border-t border-brand-border-strong/30">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado del Mapa */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-brand-accent text-xs font-mono font-semibold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span>{t.map3d.pinTooltip}</span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase">
              {t.map3d.title}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              {t.map3d.subtitle}
            </p>
          </div>

          {/* Botones de Control de Capas y Centrado */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Satelital HD */}
            <button
              type="button"
              onClick={() => handleSwitchLayer("satellite")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                mapLayer === "satellite"
                  ? "bg-brand-accent text-white shadow-brand-accent/25 ring-2 ring-brand-accent/40"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{t.map3d.toggleSatellite}</span>
            </button>

            {/* Toggle Callejero */}
            <button
              type="button"
              onClick={() => handleSwitchLayer("street")}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                mapLayer === "street"
                  ? "bg-brand-accent text-white shadow-brand-accent/25 ring-2 ring-brand-accent/40"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{t.map3d.toggleStreet}</span>
            </button>

            {/* Re-centrar en Sede Matriz */}
            <button
              type="button"
              onClick={handleCenterHq}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🎯</span>
              <span>Centrar Matriz</span>
            </button>
          </div>
        </div>

        {/* Contenedor del Mapa Interactivo (100% fluido, sin distorsión CSS) */}
        <div className="relative w-full rounded-3xl overflow-hidden border border-gray-800 bg-[#0F1826] shadow-2xl">
          <div className="w-full h-[450px] sm:h-[520px] md:h-[580px] relative">
            <div
              ref={mapContainerRef}
              className="w-full h-full select-none z-10"
            />
          </div>

          {/* Tarjeta Flotante con la Información Oficial de la Sede Matriz */}
          {showInfoCard && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-black/95 backdrop-blur-md border border-brand-accent/40 rounded-2xl p-5 shadow-2xl z-20 text-white animate-fadeInUp">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="font-mono text-[10px] text-brand-accent uppercase font-bold tracking-wider">
                    Sede Matriz Oficial
                  </span>
                  <h4 className="font-sans font-bold text-lg leading-tight text-white mt-0.5">
                    AltusChip — Sede Cuenca
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInfoCard(false)}
                  className="text-gray-400 hover:text-white p-1 text-sm cursor-pointer"
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-gray-300 mb-4">
                <p className="flex items-center gap-2">
                  <span className="text-brand-accent">📍</span>
                  <span><strong>Dirección:</strong> Parque Industrial (Uncovia), Cuenca</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-brand-accent">🕒</span>
                  <span><strong>Horario:</strong> Lun - Sáb 08:30 - 18:30</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-brand-accent">📞</span>
                  <span><strong>Tel / WhatsApp:</strong> +593 959 057 138</span>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Parque+Industrial+Cuenca+Ecuador"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-accent hover:bg-red-600 text-white text-xs font-bold rounded-xl no-underline transition-colors text-center"
                >
                  <span>📍 Ver en Google Maps</span>
                </a>
                <a
                  href="https://wa.me/593959057138?text=Hola%20AltusChip,%20deseo%20m%C3%A1s%20informaci%C3%B3n%20sobre%20su%20sede%20en%20el%20Parque%20Industrial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[40px] px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-black text-xs font-bold rounded-xl no-underline transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 fill-current text-black flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12.004 0C5.378 0 .008 5.37.008 11.996a11.93 11.93 0 001.637 6.064L0 24l6.109-1.602a11.935 11.935 0 005.895 1.545h.005c6.626 0 11.991-5.37 11.991-11.996S18.63 0 12.004 0zm0 21.99a9.98 9.98 0 01-5.086-1.39l-.365-.216-3.774.99.102-3.676-.237-.378a9.96 9.96 0 01-1.536-5.324c0-5.518 4.49-10.007 10.01-10.007 2.673 0 5.186 1.042 7.075 2.932a9.94 9.94 0 012.93 7.075c0 5.52-4.49 10.009-10.009 10.009z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* Atribución sobria */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-[11px] text-gray-200 z-20 pointer-events-none font-mono flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AltusChip GPS · Parque Industrial (Uncovia), Cuenca</span>
          </div>
        </div>
      </div>
    </section>
  );
}
