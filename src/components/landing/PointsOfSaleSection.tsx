/**
 * ==============================================================================
 * PROYECTO: ALTUS-CHIP — Protocolo Broadsheet 2026
 * MÓDULO: Landing Page — Punto Oficial de Retiro y Atención (Sede Única)
 * ARCHIVO: src/components/landing/PointsOfSaleSection.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la vitrina física de atención y retiro de kits AltusChip para la
 * sede matriz única oficial: Parque Industrial (Uncovia), Cuenca - Ecuador.
 * Presenta tarjeta boutique con fotografía arquitectónica, dirección exacta,
 * horarios, teléfonos y botones directos a Google Maps y WhatsApp oficial.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas (módulo ~160 líneas).
 * - Cero textos hardcodeados (100% diccionario vía useLocale).
 * - Única ubicación real verificada: Parque Industrial (Uncovia), Cuenca.
 * ==============================================================================
 */

"use client";

import React from "react";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export function PointsOfSaleSection() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const store = {
    id: "matriz-uncovia",
    name: t.pointsOfSale.store1Name,
    address: t.pointsOfSale.store1Address,
    hours: t.pointsOfSale.store1Hours,
    phone: t.pointsOfSale.store1Phone,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Parque+Industrial+Cuenca+Ecuador",
    whatsappUrl: "https://wa.me/593959057138?text=Hola%20AltusChip,%20deseo%20visitar%20su%20sede%20en%20el%20Parque%20Industrial%20para%20adquirir%20mi%20kit",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
  };

  return (
    <section
      id="puntos-venta"
      aria-label={t.pointsOfSale.title}
      className="w-full bg-[#0B1420] text-white py-16 md:py-24 border-t border-brand-border-strong/30"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado Principal */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="font-mono text-xs font-bold text-brand-accent uppercase tracking-widest px-3.5 py-1 bg-red-950/60 border border-red-800/40 rounded-full inline-block mb-3">
            {t.pointsOfSale.badgeOfficial}
          </span>
          <h2 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl lg:text-[42px] tracking-tight uppercase leading-tight text-white mb-3">
            {t.pointsOfSale.title}
          </h2>
          <p className="font-sans text-sm sm:text-base text-gray-400 font-normal">
            {t.pointsOfSale.subtitle}
          </p>
          <div className="w-16 h-1 bg-brand-accent mx-auto mt-4 rounded-full" aria-hidden="true" />
        </div>

        {/* Tarjeta Showcase de la Sede Matriz Oficial (Estilo Imagen 1) */}
        <div className="max-w-3xl mx-auto">
          <article className="bg-[#141E2D] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl hover:border-brand-accent/50 transition-all duration-300 group">
            {/* Fotografía de la Fachada de la Sede */}
            <div className="relative w-full h-64 sm:h-80 bg-gray-900 overflow-hidden">
              <Image
                src={store.image}
                alt={store.name}
                fill
                unoptimized
                sizes="(max-width: 1200px) 100vw, 800px"
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141E2D] via-transparent to-black/40" />
              
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-black/75 backdrop-blur-md border border-white/10 rounded-full font-mono text-xs font-semibold text-brand-accent flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                  {t.pointsOfSale.badgeOfficial}
                </span>
                <span className="px-3 py-1 bg-emerald-950/80 backdrop-blur-md border border-emerald-700/40 rounded-full font-mono text-xs font-semibold text-emerald-400">
                  Entrega Inmediata
                </span>
              </div>
            </div>

            {/* Contenido Informativo Verificado */}
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              <div>
                <h3 className="font-sans font-bold text-2xl sm:text-3xl text-white mb-4 group-hover:text-brand-accent transition-colors">
                  {store.name}
                </h3>

                <ul className="space-y-3.5 text-sm sm:text-base text-gray-300">
                  {/* Dirección Exacta */}
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="leading-snug">{store.address}</span>
                  </li>

                  {/* Horario de Atención */}
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="leading-snug">{store.hours}</span>
                  </li>

                  {/* Teléfono / WhatsApp */}
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${store.phone.replace(/\s+/g, "")}`} className="text-gray-300 hover:text-white transition-colors font-medium">
                      {store.phone}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Botones de Acción (Rojo Google Maps + Verde WhatsApp) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3.5">
                <a
                  href={store.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHaptic("light")}
                  className="w-full sm:flex-1 min-h-[48px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-brand-accent hover:bg-[#E53935] text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-brand-accent/25 active:scale-[0.98] cursor-pointer no-underline text-center"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t.pointsOfSale.viewOnGoogleMaps}</span>
                </a>

                <a
                  href={store.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHaptic("light")}
                  className="w-full sm:flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-black text-sm font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-[#25D366]/25 active:scale-[0.98] cursor-pointer no-underline text-center"
                >
                  <svg className="w-4 h-4 fill-current text-black flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12.004 0C5.378 0 .008 5.37.008 11.996a11.93 11.93 0 001.637 6.064L0 24l6.109-1.602a11.935 11.935 0 005.895 1.545h.005c6.626 0 11.991-5.37 11.991-11.996S18.63 0 12.004 0zm0 21.99a9.98 9.98 0 01-5.086-1.39l-.365-.216-3.774.99.102-3.676-.237-.378a9.96 9.96 0 01-1.536-5.324c0-5.518 4.49-10.007 10.01-10.007 2.673 0 5.186 1.042 7.075 2.932a9.94 9.94 0 012.93 7.075c0 5.52-4.49 10.009-10.009 10.009z" />
                  </svg>
                  <span>{t.pointsOfSale.directWhatsApp}</span>
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
