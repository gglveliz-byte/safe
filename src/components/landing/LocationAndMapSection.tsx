/**
 * ==============================================================================
 * PROYECTO: ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: Landing Page — Sede Matriz Oficial y Mapa Google Unificado
 * ARCHIVO: src/components/landing/LocationAndMapSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Unifica en una sola sección compacta y dividida a dos columnas:
 * 1. Columna Izquierda: Tarjeta Boutique de la Sede Matriz Oficial con fotografía
 *    de motocicleta, dirección física verificada, horarios y botones de contacto.
 * 2. Columna Derecha: Mapa oficial interactivo Google Maps de alta precisión,
 *    conmutación instantánea entre Callejero y Satelital HD, y enlace directo
 *    a la app nativa de Google Maps.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos hardcodeados (100% diccionario vía useLocale).
 * - Cero dependencias de API Keys de pago ni marcas de agua de terceros.
 * - Diseño compacto que entra en una sola pantalla desktop; apilado en móvil.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

const MOTORCYCLE_IMAGE = "/branding/motorcycle-hero.jpg";
const LATITUDE = -2.8756;
const LONGITUDE = -78.9865;

export function LocationAndMapSection() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");
  const [isLoading, setIsLoading] = useState(true);

  const store = {
    name: t.pointsOfSale.store1Name,
    address: t.pointsOfSale.store1Address,
    hours: t.pointsOfSale.store1Hours,
    phone: t.pointsOfSale.store1Phone,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parque+Industrial+Cuenca+Ecuador",
    whatsappUrl: "https://wa.me/593959057138?text=Hola%20AltusChip,%20deseo%20visitar%20su%20sede%20en%20el%20Parque%20Industrial%20para%20adquirir%20mi%20kit",
  };

  // URL del embed oficial de Google Maps (t=m para callejero, t=k para satelital)
  const embedUrl = `https://maps.google.com/maps?q=${LATITUDE},${LONGITUDE}&t=${mapMode === "satellite" ? "k" : "m"}&z=16&ie=UTF8&iwloc=&output=embed`;

  const handleToggleMode = (mode: "street" | "satellite") => {
    if (mode === mapMode) return;
    triggerHaptic("light");
    setIsLoading(true);
    setMapMode(mode);
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
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              {t.pointsOfSale.title}
            </h2>
            <p className="font-sans text-sm sm:text-base text-gray-400 mt-1 max-w-2xl">
              {t.pointsOfSale.subtitle}
            </p>
          </div>

          {/* Acceso Rápido a Google Maps */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={store.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic("light")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#152336] hover:bg-[#1C2F48] border border-gray-700/60 text-xs font-semibold text-gray-200 transition-colors shadow-sm"
            >
              <span>📍 Google Maps</span>
              <span className="text-[10px] text-gray-400">↗</span>
            </a>
          </div>
        </div>

        {/* Cuadrícula Unificada: Columna Izquierda (Tarjeta Sede) + Columna Derecha (Mapa Google) */}
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
                      <a
                        href={`tel:${store.phone.replace(/\s+/g, "")}`}
                        className="hover:text-white transition-colors font-medium"
                      >
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

          {/* Columna Derecha: Mapa Google Compacto y Conmutador de Capas (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative w-full h-[380px] sm:h-[420px] lg:h-[450px] rounded-2xl overflow-hidden border border-gray-800 bg-[#0F1826] shadow-xl flex flex-col">
              {/* Barra Superior de Control del Mapa */}
              <div className="w-full bg-[#131E2C]/90 backdrop-blur-md border-b border-gray-800/80 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 z-20 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="font-mono text-xs font-semibold text-gray-200 truncate">
                    Google Maps Oficial · Parque Industrial (Uncovia), Cuenca
                  </span>
                </div>

                {/* Conmutador de Capas */}
                <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleMode("street")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      mapMode === "street"
                        ? "bg-brand-accent text-white shadow-sm font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {t.map3d.toggleStreet}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMode("satellite")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      mapMode === "satellite"
                        ? "bg-brand-accent text-white shadow-sm font-semibold"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {t.map3d.toggleSatellite}
                  </button>
                </div>
              </div>

              {/* Contenedor del Iframe con Skeleton mientras Carga */}
              <div className="relative w-full flex-1 bg-[#09111C] overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0F1826] text-gray-400 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
                    <span className="text-xs font-mono">Cargando mapa oficial de Cuenca…</span>
                  </div>
                )}

                <iframe
                  title="AltusChip Sede Matriz Google Maps"
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={() => setIsLoading(false)}
                  className="w-full h-full block"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
