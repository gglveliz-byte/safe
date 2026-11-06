/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: UI de Autor — Modal de Opinión y Retroalimentación de Clientes
 * ARCHIVO: src/components/feedback/FeedbackModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal técnico y elegante de retroalimentación para permitir a los motociclistas
 * valorar el servicio de 1 a 5 estrellas y compartir comentarios de mejora.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - CERO emojis: estética vectorial pura Incident 2026.
 * - Táctiles ≥44px y respuesta háptica.
 * - Bilingüe con soporte useLocale().
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import { StarRating } from "./StarRating";
import { useHaptic } from "@/hooks/useHaptic";
import { useLocale } from "@/hooks/useLocale";

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { locale } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [rating, setRating] = useState<number>(5);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [comment, setComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(locale === "es" ? "Por favor escribe tu nombre." : "Please enter your name.");
      return;
    }
    if (comment.trim().length < 10) {
      setErrorMessage(
        locale === "es"
          ? "Por favor escribe un comentario de al menos 10 caracteres."
          : "Please write a feedback of at least 10 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    triggerHaptic("light");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim() || undefined,
          vehicle: vehicle.trim() || undefined,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al enviar comentario.");
      }

      triggerHaptic("success");
      setIsSuccess(true);
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : "Error de red al enviar opinión.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setRating(5);
    setName("");
    setCity("");
    setVehicle("");
    setComment("");
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-dark/70 backdrop-blur-xs animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-brand-white border border-brand-border-subtle rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Botón de cerrar (X vectorial) */}
        <button
          type="button"
          onClick={handleResetAndClose}
          aria-label={locale === "es" ? "Cerrar modal" : "Close modal"}
          className="absolute top-4 right-4 p-2 text-brand-text-muted hover:text-brand-navy-dark rounded-lg cursor-pointer transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center text-center py-8 gap-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif text-2xl font-bold text-brand-navy-dark">
                {locale === "es" ? "Gracias por tu opinión" : "Thank you for your feedback"}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-brand-text-desc max-w-sm">
                {locale === "es"
                  ? "Tu valoración nos ayuda a perfeccionar la red de asistencia y protección de motociclistas."
                  : "Your review helps us refine the rider rescue network and protection technology."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mt-2 min-h-[44px] px-6 py-2.5 bg-brand-navy-dark text-white rounded-xl font-sans text-xs font-bold hover:bg-brand-navy-secondary transition-colors cursor-pointer"
            >
              {locale === "es" ? "Cerrar ventana" : "Close window"}
            </button>
          </div>
        ) : (
          <>
            {/* Cabecera Técnica */}
            <div className="flex flex-col gap-1 pr-6">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-brand-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                <span>{locale === "es" ? "CONTROL DE CALIDAD & SERVICIO" : "QUALITY & SERVICE ASSURANCE"}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-brand-navy-dark">
                {locale === "es" ? "¿Qué opinas del sistema?" : "How is your experience with SAFE?"}
              </h2>
              <p className="font-sans text-xs text-brand-text-desc leading-relaxed">
                {locale === "es"
                  ? "Tu experiencia y sugerencias nos ayudan a mejorar el servicio de rescate vial y la plataforma."
                  : "Your feedback helps us continuously improve the emergency rescue network for all riders."}
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Selector de Estrellas */}
              <div className="flex flex-col items-center justify-center p-4 bg-brand-bg-alt/70 border border-brand-border-subtle rounded-xl gap-2">
                <span className="font-sans text-xs font-semibold text-brand-navy-dark">
                  {locale === "es" ? "Tu Calificación General:" : "Your Overall Rating:"}
                </span>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>

              {/* Nombre y Ciudad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                    {locale === "es" ? "Nombre completo *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={locale === "es" ? "Ej. Carlos Méndez" : "e.g. Carlos Mendez"}
                    className="safe-input-focus h-10 px-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-xs text-brand-navy-dark"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                    {locale === "es" ? "Ciudad y País" : "City & Country"}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={locale === "es" ? "Ej. Quito, Ecuador" : "e.g. Quito, Ecuador"}
                    className="safe-input-focus h-10 px-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-xs text-brand-navy-dark"
                  />
                </div>
              </div>

              {/* Vehículo / Moto */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                  {locale === "es" ? "Vehículo / Rol (opcional)" : "Vehicle / Role (optional)"}
                </label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder={locale === "es" ? "Ej. Yamaha MT-09 / Piloto Touring / Paramédico" : "e.g. Yamaha MT-09 / Paramedic"}
                  className="safe-input-focus h-10 px-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-xs text-brand-navy-dark"
                />
              </div>

              {/* Comentario */}
              <div className="flex flex-col gap-1">
                <label className="font-sans text-xs font-semibold text-brand-navy-dark">
                  {locale === "es" ? "Tu comentario u opinión *" : "Your feedback or review *"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    locale === "es"
                      ? "Cuéntanos qué te parece el servicio, la facilidad de uso del casco o qué sugerencia tienes para mejorar..."
                      : "Tell us about your experience with the chip, the medical profile or any suggestions..."
                  }
                  className="safe-input-focus p-3 bg-brand-white border border-brand-border-field rounded-lg font-sans text-xs text-brand-navy-dark placeholder-brand-text-muted resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-brand-accent/30 rounded-lg text-xs font-sans text-brand-accent">
                  {errorMessage}
                </div>
              )}

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-2.5 px-5 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white font-sans text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {isSubmitting
                  ? locale === "es"
                    ? "Enviando opinión..."
                    : "Sending feedback..."
                  : locale === "es"
                  ? "Enviar Valoración"
                  : "Submit Review"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
