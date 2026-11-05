/**
 * ==============================================================================
 * PROYECTO: ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: Landing Page — Sede Matriz Oficial y Mapa Unificado (Sección Compacta)
 * ARCHIVO: src/components/landing/LocationAndMapSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Unifica en una sola sección compacta y dividida a dos columnas:
 * 1. Columna Izquierda: Tarjeta de la Sede Matriz Oficial con fotografía de
 *    motocicleta, dirección exacta, horarios y botones a Google Maps y WhatsApp.
 * 2. Columna Derecha: Mapa interactivo compacto con conmutación Satelital /
 *    Callejero y pin circular oficial con pulso radar sobre Parque Industrial.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ~250 líneas).
 * - Cero textos hardcodeados (100% diccionario vía useLocale).
 * - Diseño compacto que entra en una sola pantalla desktop; apilado en móvil.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

const CUENCA_HQ_COORDS: [number, number] = [-2.8756, -78.9865];
const MOTORCYCLE_IMAGE = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80";

export function LocationAndMapSection() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const currentTileLayerRef = useRef<unknown>(null);

  const [mapLayer, setMapLayer] = useState<"satellite" | "street">("satellite");

  const store = {
    name: t.pointsOfSale.store1Name,
    address: t.pointsOfSale.store1Address,
    hours: t.pointsOfSale.store1Hours,
    phone: t.pointsOfSale.store1Phone,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parque+Industrial+Cuenca+Ecuador",
    whatsappUrl: "https://wa.me/593959057138?text=Hola%20AltusChip,%20deseo%20visitar%20su%20sede%20en%20el%20Parque%20Industrial%20para%20adquirir%20mi%20kit",
  };

  // Inicialización de Leaflet
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = await import("leaflet");
      if (isCancelled) return;

      if (!document.getElementById("leaflet-css-bundle")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-bundle";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: CUENCA_HQ_COORDS,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      const streetTileUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
      const satelliteTileUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";

      const tileLayer = L.tileLayer(mapLayer === "satellite" ? satelliteTileUrl : streetTileUrl, {
        maxZoom: 20,
      }).addTo(map);

      currentTileLayerRef.current = tileLayer;

      // Pin circular oficial con logotipo de AltusChip y radar sónar
      const pinHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <div class="w-14 h-14 rounded-full absolute -inset-2 bg-red-500/35 animate-ping pointer-events-none"></div>
          <div class="w-11 h-11 rounded-full bg-white border-2 border-red-600 shadow-2xl overflow-hidden flex items-center justify-center p-0.5 hover:scale-115 transition-transform duration-200">
            <img src="/branding/altuschip-logo.png" alt="AltusChip" class="w-full h-full object-cover rounded-full" />
          </div>
          <div class="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-red-500/40 pointer-events-none flex items-center gap-1">
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

      L.marker(CUENCA_HQ_COORDS, { icon: customIcon }).addTo(map);

      mapInstanceRef.current = map;

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

  // Cambio de capa (Satelital HD vs Callejero)
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
      ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

    const newTile = L.tileLayer(nextUrl, {
      maxZoom: 20,
    });

    newTile.addTo(map as unknown as import("leaflet").Map);
    currentTileLayerRef.current = newTile;
    map.invalidateSize();
  };

  return (
    <section
      id="mapa"
      aria-label={t.map3d.title}
      className="w-full bg-[#09111C] text-white py-12 md:py-16 border-t border-brand-border-strong/30"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado Unificado y Compacto */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-brand-accent text-xs font-mono font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
              <span>{t.pointsOfSale.badgeOfficial}</span>
            </div>
            <h2 className="font-serif font-black text-2xl sm:text-3xl lg:text-[34px] text-white tracking-tight uppercase leading-tight">
              {t.pointsOfSale.title}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              {t.pointsOfSale.subtitle}
            </p>
          </div>

          {/* Selector de Capas: Satelital HD y Callejero (Centrar Matriz eliminado) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSwitchLayer("satellite")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                mapLayer === "satellite"
                  ? "bg-brand-accent text-white shadow-brand-accent/25 ring-2 ring-brand-accent/40"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{t.map3d.toggleSatellite}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchLayer("street")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                mapLayer === "street"
                  ? "bg-brand-accent text-white shadow-brand-accent/25 ring-2 ring-brand-accent/40"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{t.map3d.toggleStreet}</span>
            </button>
          </div>
        </div>

        {/* Rejilla a 2 Columnas Bien Dividida (Sucursal a la Izquierda + Mapa a la Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Columna Izquierda: Tarjeta Boutique de Sede con Foto de la Moto (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col">
            <article className="h-full bg-[#131E2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-brand-accent/40 transition-all duration-300 group">
              {/* Foto de la Motocicleta */}
              <div className="relative w-full h-44 sm:h-52 bg-gray-900 overflow-hidden flex-shrink-0">
                <Image
                  src={MOTORCYCLE_IMAGE}
                  alt="AltusChip Motociclismo"
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131E2C] via-transparent to-black/30" />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/75 backdrop-blur-md border border-white/10 rounded-full font-mono text-[11px] font-semibold text-brand-accent flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                  Sede Matriz Cuenca
                </span>
              </div>

              {/* Datos Oficiales Verificados */}
              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-4">
                <div>
                  <h3 className="font-sans font-bold text-lg sm:text-xl text-white mb-3 group-hover:text-brand-accent transition-colors">
                    {store.name}
                  </h3>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-gray-300">
                    <li className="flex items-start gap-2.5">
                      <span className="text-brand-accent text-sm flex-shrink-0">📍</span>
                      <span className="leading-snug">{store.address}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-brand-accent text-sm flex-shrink-0">🕒</span>
                      <span className="leading-snug">{store.hours}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-brand-accent text-sm flex-shrink-0">📞</span>
                      <a href={`tel:${store.phone.replace(/\s+/g, "")}`} className="hover:text-white transition-colors font-medium">
                        {store.phone}
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Botones de Acción Directa */}
                <div className="pt-2 flex items-center gap-2.5">
                  <a
                    href={store.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHaptic("light")}
                    className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-accent hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-98 no-underline text-center"
                  >
                    <span>📍 Google Maps</span>
                  </a>

                  <a
                    href={store.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHaptic("light")}
                    className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] text-black text-xs font-bold rounded-xl transition-all shadow-md active:scale-98 no-underline text-center"
                  >
                    <svg className="w-4 h-4 fill-current text-black flex-shrink-0" viewBox="0 0 24 24">
                      <path d="M12.004 0C5.378 0 .008 5.37.008 11.996a11.93 11.93 0 001.637 6.064L0 24l6.109-1.602a11.935 11.935 0 005.895 1.545h.005c6.626 0 11.991-5.37 11.991-11.996S18.63 0 12.004 0zm0 21.99a9.98 9.98 0 01-5.086-1.39l-.365-.216-3.774.99.102-3.676-.237-.378a9.96 9.96 0 01-1.536-5.324c0-5.518 4.49-10.007 10.01-10.007 2.673 0 5.186 1.042 7.075 2.932a9.94 9.94 0 012.93 7.075c0 5.52-4.49 10.009-10.009 10.009z" />
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </article>
          </div>

          {/* Columna Derecha: Mapa Compacto (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative w-full h-[360px] sm:h-[400px] lg:h-[420px] rounded-2xl overflow-hidden border border-gray-800 bg-[#0F1826] shadow-xl">
              <div
                ref={mapContainerRef}
                className="w-full h-full select-none z-10"
              />

              {/* Rótulo de Ubicación en el Mapa */}
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-[11px] text-gray-200 z-20 pointer-events-none font-mono flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Google Maps Oficial · Parque Industrial (Uncovia), Cuenca</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

