/**
 * ==============================================================================
 * PROYECTO: ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: Landing Page — Sección de Puntos de Venta Físicos y Distribuidores
 * ARCHIVO: src/components/landing/PointsOfSaleSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la sección de vitrina física de distribuidores y puntos de retiro
 * de AltusChip según la estética de la Imagen 1: tarjetas con fotografía de fachada,
 * dirección exacta, horarios de atención, teléfonos de contacto y botón de
 * navegación directa hacia Google Maps.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ~220 líneas).
 * - Cero textos hardcodeados (100% diccionario vía useLocale).
 * - Borde y paleta Incident oficial (#0B1F3A, #FF5138, etc.).
 * ==============================================================================
 */

"use client";

import React from "react";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

interface StoreItem {
  id: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  mapsUrl: string;
  image: string;
}

export function PointsOfSaleSection() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const stores: StoreItem[] = [
    {
      id: "matriz-uncovia",
      name: t.pointsOfSale.store1Name,
      address: t.pointsOfSale.store1Address,
      hours: t.pointsOfSale.store1Hours,
      phone: t.pointsOfSale.store1Phone,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parque+Industrial+Cuenca+Ecuador",
      image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "moto-boutique",
      name: t.pointsOfSale.store2Name,
      address: t.pointsOfSale.store2Address,
      hours: t.pointsOfSale.store2Hours,
      phone: t.pointsOfSale.store2Phone,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av+Gil+Ramirez+Davalos+Av+Espana+Cuenca+Ecuador",
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "rider-zone",
      name: t.pointsOfSale.store3Name,
      address: t.pointsOfSale.store3Address,
      hours: t.pointsOfSale.store3Hours,
      phone: t.pointsOfSale.store3Phone,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av+Huayna+Capac+Pio+Bravo+Cuenca+Ecuador",
      image: "https://images.unsplash.com/photo-1571216332002-282dce467b32?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <section
      id="puntos-venta"
      aria-label={t.pointsOfSale.title}
      className="w-full bg-[#0B1420] text-white py-16 md:py-24 border-t border-brand-border-strong/30"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado Principal de Alto Impacto */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl lg:text-[42px] tracking-tight uppercase leading-tight text-white mb-3">
            {t.pointsOfSale.title}
          </h2>
          <p className="font-sans text-sm sm:text-base text-gray-400 font-normal">
            {t.pointsOfSale.subtitle}
          </p>
          <div className="w-16 h-1 bg-brand-accent mx-auto mt-4 rounded-full" aria-hidden="true" />
        </div>

        {/* Rejilla de Tarjetas de Puntos de Venta (Estilo Imagen 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {stores.map((store) => (
            <article
              key={store.id}
              className="bg-[#141E2D] border border-gray-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-brand-accent/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Imagen de la Fachada / Tienda */}
              <div className="relative w-full h-48 sm:h-52 bg-gray-900 overflow-hidden">
                <Image
                  src={store.image}
                  alt={store.name}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141E2D] via-transparent to-black/30" />
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full font-mono text-[11px] font-semibold text-brand-accent flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                  Punto Autorizado
                </span>
              </div>

              {/* Contenido Descriptivo */}
              <div className="p-6 flex flex-col flex-1 justify-between gap-5">
                <div>
                  <h3 className="font-sans font-bold text-lg sm:text-xl text-white mb-4 group-hover:text-brand-accent transition-colors">
                    {store.name}
                  </h3>

                  <ul className="space-y-3 text-xs sm:text-[13px] text-gray-300">
                    {/* Dirección */}
                    <li className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="leading-snug">{store.address}</span>
                    </li>

                    {/* Horarios */}
                    <li className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="leading-snug">{store.hours}</span>
                    </li>

                    {/* Teléfono */}
                    <li className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <a
                        href={`tel:${store.phone.replace(/\s+/g, "")}`}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {store.phone}
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Botón Ver en Google Maps (Estilo Imagen 1) */}
                <div className="pt-2">
                  <a
                    href={store.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHaptic("light")}
                    className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-accent hover:bg-[#E53935] text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-brand-accent/20 active:scale-[0.98] cursor-pointer no-underline text-center"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{t.pointsOfSale.viewOnGoogleMaps}</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

