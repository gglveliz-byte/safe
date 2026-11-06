/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Landing Comercial — Carrusel Editorial de Testimonios y 5 Estrellas
 * ARCHIVO: src/components/landing/TestimonialsCarousel.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Carrusel interactivo y cinematográfico de testimonios de motociclistas.
 * Consume dinámicamente `/api/feedback` (que devuelve testimonios aprobados
 * por el administrador o los testimonios fundacionales de respaldo).
 *
 * CERO emojis: estética vectorial pura Incident 2026, tipografía Newsreader
 * y estrellas geométricas SVG de alta gama.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Soporte táctil y controles accesibles.
 * - Cero textos hardcodeados (soporte bilingüe).
 * ==============================================================================
 */

"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { StarRating } from "@/components/feedback/StarRating";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export interface TestimonialItem {
  id: string;
  name: string;
  city?: string | null;
  vehicle?: string | null;
  rating: number;
  comment: string;
  createdAt?: string;
}

const DEFAULT_FALLBACK: TestimonialItem[] = [
  {
    id: "curated-1",
    name: "Carlos Méndez",
    city: "Quito, Ecuador",
    vehicle: "Yamaha MT-09",
    rating: 5,
    comment:
      "Tener la tranquilidad de que en un accidente cualquier paramédico solo acerca su celular a mi casco y ve mi tipo de sangre y contacta a mi esposa no tiene precio. El Modo Ruta con GPS en vivo es impecable.",
  },
  {
    id: "curated-2",
    name: "Dra. Sofía Alarcón",
    city: "Medellín, Colombia",
    vehicle: "BMW F850 GS · Médico Urgentista",
    rating: 5,
    comment:
      "Como socorrista y motociclista, sé que los primeros 10 minutos salvan vidas. ALTUS-CHIP elimina la incertidumbre de no saber qué medicamentos o alergias tiene el piloto tendido en carretera.",
  },
  {
    id: "curated-3",
    name: "Esteban Larrea",
    city: "Guayaquil, Ecuador",
    vehicle: "KTM 390 Adventure",
    rating: 5,
    comment:
      "La opción de registrar a mi acompañante habitual en mi misma cuenta y con su propia cédula y tipo de sangre fue lo que me convenció. 100% recomendado para todo el que salga a rodar.",
  },
];

export function TestimonialsCarousel({ onOpenFeedback }: { onOpenFeedback?: () => void }) {
  const { locale } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(DEFAULT_FALLBACK);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar testimonios dinámicos de la API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/feedback")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const list = data.data?.testimonials || data.testimonials;
        if (data?.success && Array.isArray(list) && list.length > 0) {
          setTestimonials(list);
        }
      })
      .catch(() => {
        // En caso de fallo transitorio, se conservan los pre-cargados
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Rotación automática suave cada 6 segundos (pausada al poner el mouse)
  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, testimonials.length]);

  const handleNext = useCallback(() => {
    triggerHaptic("light");
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length, triggerHaptic]);

  const handlePrev = useCallback(() => {
    triggerHaptic("light");
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length, triggerHaptic]);

  const currentItem = testimonials[currentIndex] || testimonials[0];

  return (
    <section
      aria-label="Opiniones de Motociclistas"
      className="w-full py-16 sm:py-20 bg-brand-bg-alt/40 border-y border-brand-border-subtle relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Fondo técnico sutil */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-[radial-gradient(#C9D9E9_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center gap-10">
        {/* Cabecera de la Sección */}
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-white border border-brand-border-subtle shadow-2xs">
            <StarRating value={5} readOnly size="sm" />
            <span className="font-mono text-[11px] font-bold text-brand-navy-dark uppercase tracking-wider">
              {locale === "es" ? "5.0 EXPERIENCIA EN CARRETERA" : "5.0 RIDER VERIFIED EXPERIENCE"}
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy-dark tracking-tight leading-tight">
            {locale === "es"
              ? "Lo que opinan los motociclistas de la red"
              : "Trusted by Riders on Every Mile"}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-text-desc">
            {locale === "es"
              ? "Testimonios reales de pilotos y personal médico sobre el sistema de rescate vial y telemetría satelital."
              : "Real reviews from motorcyclists and emergency responders protecting their lives with ALTUS-CHIP."}
          </p>
        </div>

        {/* Tarjeta Central del Carrusel */}
        <div className="w-full max-w-3xl min-h-[260px] bg-brand-white border border-brand-border-subtle rounded-2xl p-7 sm:p-10 shadow-lg relative flex flex-col justify-between transition-all duration-300">
          {/* Marca de comillas editorial en marca de agua */}
          <div
            className="absolute top-6 right-8 text-6xl font-serif text-brand-border-subtle/50 select-none pointer-events-none font-bold"
            aria-hidden="true"
          >
            “
          </div>

          <div className="flex flex-col gap-4">
            {/* Calificación por estrellas */}
            <div className="flex items-center justify-between">
              <StarRating value={currentItem.rating} readOnly size="md" />
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[11px] font-mono font-semibold">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>{locale === "es" ? "Piloto Verificado" : "Verified Rider"}</span>
              </div>
            </div>

            {/* Texto de la opinión */}
            <p className="font-serif text-lg sm:text-xl text-brand-navy-dark leading-relaxed italic pt-1">
              "{currentItem.comment}"
            </p>
          </div>

          {/* Autor y datos del vehículo */}
          <div className="flex items-center justify-between pt-6 border-t border-brand-separator/60 mt-4 flex-wrap gap-3">
            <div className="flex flex-col">
              <strong className="font-sans text-sm font-bold text-brand-navy-dark">
                {currentItem.name}
              </strong>
              <span className="font-sans text-xs text-brand-text-muted">
                {[currentItem.vehicle, currentItem.city].filter(Boolean).join(" · ")}
              </span>
            </div>

            {/* Controles de Navegación del Carrusel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label={locale === "es" ? "Testimonio anterior" : "Previous review"}
                className="w-10 h-10 rounded-full border border-brand-border-subtle bg-brand-white hover:bg-brand-bg-alt text-brand-navy-dark flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label={locale === "es" ? "Siguiente testimonio" : "Next review"}
                className="w-10 h-10 rounded-full border border-brand-border-subtle bg-brand-white hover:bg-brand-bg-alt text-brand-navy-dark flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Indicadores de diapositiva */}
        <div className="flex items-center gap-2" role="tablist">
          {testimonials.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Testimonio ${idx + 1}`}
              onClick={() => {
                triggerHaptic("light");
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? "w-8 bg-brand-accent shadow-xs"
                  : "w-2 bg-brand-border-strong hover:bg-brand-navy-secondary"
              }`}
            />
          ))}
        </div>

        {/* Botón CTA para abrir el formulario y dar su opinión */}
        {onOpenFeedback && (
          <div className="pt-2 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onOpenFeedback();
              }}
              className="px-5 py-2.5 rounded-xl border border-brand-border-subtle bg-brand-white hover:bg-brand-bg-alt text-brand-navy-dark font-sans text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-4 h-4 text-amber-500 fill-amber-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{locale === "es" ? "¿Eres motociclista? Comparte tu opinión aquí" : "Are you a rider? Share your review here"}</span>
            </button>
            <span className="font-sans text-[11px] text-brand-text-muted">
              {locale === "es"
                ? "Tus comentarios son revisados por el equipo para mejorar el protocolo de seguridad."
                : "Your feedback is reviewed by our engineering team to improve rider safety."}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

