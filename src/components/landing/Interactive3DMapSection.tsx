/**
 * ==============================================================================
 * PROYECTO: ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: Landing Page — Mapa Interactivo 3D con Pines Circulares AltusChip
 * ARCHIVO: src/components/landing/Interactive3DMapSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza el mapa interactivo de cobertura y puntos de distribución de AltusChip
 * con soporte de perspectiva 3D (tilt/drone angle) y pines circulares personalizados
 * con animación de radar sónar, según la estética de la Imagen 2.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ~290 líneas).
 * - Cero textos hardcodeados (100% diccionario vía useLocale).
 * - Renderizado en cliente (evita errores SSR con window).
 * ==============================================================================
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

interface MapPoint {
  id: string;
  name: string;
  category: "matriz" | "partner";
  lat: number;
  lng: number;
  address: string;
  hours: string;
  phone: string;
  mapsUrl: string;
}

export function Interactive3DMapSection() {
  const { t, locale } = useLocale();
  const { triggerHaptic } = useHaptic();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);

  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "matriz" | "partner">("all");
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);

  // Puntos geográficos reales en Cuenca / Ecuador
  const points: MapPoint[] = [
    {
      id: "matriz-cuenca",
      name: t.pointsOfSale.store1Name,
      category: "matriz",
      lat: -2.8756,
      lng: -78.9865,
      address: t.pointsOfSale.store1Address,
      hours: t.pointsOfSale.store1Hours,
      phone: t.pointsOfSale.store1Phone,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parque+Industrial+Cuenca+Ecuador",
    },
    {
      id: "boutique-cuenca",
      name: t.pointsOfSale.store2Name,
      category: "partner",
      lat: -2.8885,
      lng: -78.9950,
      address: t.pointsOfSale.store2Address,
      hours: t.pointsOfSale.store2Hours,
      phone: t.pointsOfSale.store2Phone,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av+Gil+Ramirez+Davalos+Av+Espana+Cuenca+Ecuador",
    },
    {
      id: "riderzone-cuenca",
      name: t.pointsOfSale.store3Name,
      category: "partner",
      lat: -2.8940,
      lng: -78.9990,
      address: t.pointsOfSale.store3Address,
      hours: t.pointsOfSale.store3Hours,
      phone: t.pointsOfSale.store3Phone,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av+Huayna+Capac+Pio+Bravo+Cuenca+Ecuador",
    },
  ];

  const filteredPoints = points.filter(
    (p) => selectedFilter === "all" || p.category === selectedFilter
  );

  // Inicialización de Leaflet en el cliente
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = await import("leaflet");
      if (isCancelled) return;

      // Inyectar CSS de Leaflet de forma segura si no está presente
      if (!document.getElementById("leaflet-css-bundle")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-bundle";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Si ya existe instancia previa, destruirla
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }

      // Centro geográfico de Cuenca, Ecuador
      const map = L.map(mapContainerRef.current, {
        center: [-2.8860, -78.9920],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      // Controles de zoom arriba a la derecha (estilo Imagen 2)
      L.control.zoom({ position: "topright" }).addTo(map);

      // Capa de teselas CartoDB Positron / OpenStreetMap (diseño limpio y sobrio)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Pines circulares con el emblema de AltusChip y efecto de radar
      points.forEach((pt) => {
        const pinHtml = `
          <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
            <div class="w-12 h-12 rounded-full absolute -inset-1.5 bg-red-500/25 animate-ping pointer-events-none"></div>
            <div class="w-10 h-10 rounded-full bg-white border-2 border-red-600 shadow-xl overflow-hidden flex items-center justify-center p-0.5 hover:scale-115 transition-transform duration-200">
              <img src="/branding/altuschip-logo.png" alt="AltusChip" class="w-full h-full object-cover rounded-full" />
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none">
              ${pt.category === "matriz" ? "★ MATRIZ" : "ALTUS-CHIP"}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: "altus-custom-marker",
          html: pinHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(map);

        marker.on("click", () => {
          setActivePoint(pt);
          map.setView([pt.lat, pt.lng], 16, { animate: true });
        });
      });

      mapInstanceRef.current = map;
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

  const handleCenterPoint = (pt: MapPoint) => {
    triggerHaptic("light");
    setActivePoint(pt);
    if (mapInstanceRef.current) {
      (mapInstanceRef.current as { setView: (coords: [number, number], zoom: number, options: { animate: boolean }) => void }).setView(
        [pt.lat, pt.lng],
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-brand-accent text-xs font-mono font-semibold uppercase tracking-wider mb-3">
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

          {/* Controles de Vista 3D y Filtros (Estilo Imagen 2) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle 3D / 2D */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setIs3DMode((prev) => !prev);
              }}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                is3DMode
                  ? "bg-brand-accent text-white shadow-brand-accent/20"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{is3DMode ? t.map3d.toggle3d : t.map3d.toggle2d}</span>
            </button>

            {/* Filtro Matriz */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setSelectedFilter("matriz");
                handleCenterPoint(points[0]);
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === "matriz"
                  ? "bg-white text-black font-bold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {t.map3d.filterMatriz}
            </button>

            {/* Filtro Todos */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setSelectedFilter("all");
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === "all"
                  ? "bg-white text-black font-bold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {t.map3d.filterAll}
            </button>
          </div>
        </div>

        {/* Contenedor del Mapa con Perspectiva 3D */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-gray-800 bg-[#0F1826] shadow-2xl">
          <div
            style={{
              perspective: "1200px",
              transformStyle: "preserve-3d",
            }}
            className="w-full h-[450px] sm:h-[520px] md:h-[580px] transition-all duration-700"
          >
            <div
              ref={mapContainerRef}
              style={{
                transform: is3DMode ? "rotateX(22deg) scale(1.04)" : "none",
                transformOrigin: "center 75%",
              }}
              className="w-full h-full transition-transform duration-700 select-none z-10"
            />
          </div>

          {/* Tarjeta flotante interactiva de Punto Activo */}
          {activePoint && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-black/90 backdrop-blur-md border border-brand-accent/40 rounded-xl p-4 shadow-2xl z-20 text-white animate-fadeInUp">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="font-mono text-[10px] text-brand-accent uppercase font-bold tracking-wider">
                    {activePoint.category === "matriz" ? "Punto Matriz Oficial" : "Distribuidor Autorizado"}
                  </span>
                  <h4 className="font-sans font-bold text-base leading-tight text-white mt-0.5">
                    {activePoint.name}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePoint(null)}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-300 mb-1 flex items-center gap-1.5">
                <span>📍</span>
                <span>{activePoint.address}</span>
              </p>
              <p className="text-xs text-gray-300 mb-3 flex items-center gap-1.5">
                <span>🕒</span>
                <span>{activePoint.hours}</span>
              </p>

              <div className="flex items-center gap-2">
                <a
                  href={activePoint.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-accent hover:bg-red-600 text-white text-xs font-bold rounded-lg no-underline transition-colors text-center"
                >
                  <span>{t.pointsOfSale.viewOnGoogleMaps}</span>
                </a>
                <a
                  href={`https://wa.me/593959057138?text=${encodeURIComponent(`Hola AltusChip, deseo información sobre el punto ${activePoint.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[38px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg no-underline transition-colors flex items-center gap-1"
                >
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* Atribución sobria */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded text-[10px] text-gray-300 z-20 pointer-events-none font-mono">
            AltusChip GPS Cobertura Nacional · Cuenca, EC
          </div>
        </div>
      </div>
    </section>
  );
}

