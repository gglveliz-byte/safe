/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Internacionalización — Modal de Selección de Idioma por Primera Visita
 * ARCHIVO: src/components/ui/FirstVisitLanguageModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal institucional que se despliega únicamente en la primera visita del
 * usuario a cualquier ruta pública de la plataforma (Landing, Gateway de Casco,
 * Ficha de Emergencia o Activación).
 *
 * Permite seleccionar el idioma preferido (Español / Inglés) de forma amigable
 * y visible, guardándolo en cookies y localStorage para que tanto la navegación
 * como la creación de la cuenta y las alertas adopten el idioma elegido.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (este archivo < 160 líneas).
 * - Cero textos técnicos: diseño Incident oficial con paleta autorizada.
 * - Táctiles ≥ 44px con respuesta háptica en dispositivos móviles.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { Locale } from "@/locales";

const STORAGE_KEY = "altus_first_visit_lang_selected";

export function FirstVisitLanguageModal() {
  const { setLocale } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const alreadyChosen = localStorage.getItem(STORAGE_KEY);
      if (!alreadyChosen) {
        setIsOpen(true);
      }
    } catch {
      // Ignorar en entornos de navegación privada con localStorage bloqueado
    }
  }, []);

  const handleSelectLanguage = (chosenLocale: Locale) => {
    triggerHaptic("success");
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.setItem("safe_locale", chosenLocale);
      document.cookie = `safe_locale=${chosenLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Fallback silencioso
    }
    setLocale(chosenLocale);
    setIsOpen(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Fallback silencioso
    }
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-visit-lang-title"
      className="fixed inset-0 z-50 bg-brand-navy-dark/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-brand-white border border-brand-border-subtle rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 flex flex-col items-center text-center gap-5 animate-scaleUp relative">
        {/* Botón de cierre discreto */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar / Close"
          className="absolute top-4 right-4 text-brand-text-muted hover:text-brand-navy-dark w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
        >
          ✕
        </button>

        {/* Logotipo Oficial */}
        <BrandLogo size="md" />

        {/* Títulos Bilingües de Alta Claridad */}
        <div className="flex flex-col gap-1.5 pt-1">
          <h2
            id="first-visit-lang-title"
            className="font-serif text-xl sm:text-2xl font-bold text-brand-navy-dark leading-tight"
          >
            SELECCIONA TU IDIOMA
            <span className="block text-sm font-sans font-semibold text-brand-text-desc uppercase tracking-wider mt-1">
              Select Your Language
            </span>
          </h2>
          <p className="font-sans text-xs text-brand-text-desc leading-relaxed pt-1">
            Elige tu idioma preferido para navegar, registrar tu cuenta y recibir alertas de rescate vial.
            <span className="block text-brand-text-muted text-[11px] mt-0.5">
              Choose your preferred language to browse, register, and receive roadside emergency alerts.
            </span>
          </p>
        </div>

        {/* Opciones de Selección en 2 Botones Táctiles Grandes */}
        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSelectLanguage("es")}
            className="w-full min-h-[52px] p-3.5 bg-brand-white hover:bg-brand-bg-alt border-2 border-brand-navy-dark hover:border-brand-accent rounded-xl flex items-center justify-between gap-3 text-left transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none" aria-hidden="true">🇪🇸</span>
              <div className="flex flex-col">
                <span className="font-sans text-sm font-bold text-brand-navy-dark group-hover:text-brand-accent transition-colors">
                  Español
                </span>
                <span className="font-sans text-[11px] text-brand-text-desc">
                  Continuar en Español
                </span>
              </div>
            </div>
            <span className="font-sans text-xs font-bold text-brand-navy-dark group-hover:text-brand-accent">
              →
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectLanguage("en")}
            className="w-full min-h-[52px] p-3.5 bg-brand-white hover:bg-brand-bg-alt border-2 border-brand-border-field hover:border-brand-navy-dark rounded-xl flex items-center justify-between gap-3 text-left transition-all shadow-xs cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none" aria-hidden="true">🇬🇧</span>
              <div className="flex flex-col">
                <span className="font-sans text-sm font-bold text-brand-navy-dark group-hover:text-brand-nav-blue transition-colors">
                  English
                </span>
                <span className="font-sans text-[11px] text-brand-text-desc">
                  Continue in English
                </span>
              </div>
            </div>
            <span className="font-sans text-xs font-bold text-brand-navy-dark group-hover:text-brand-nav-blue">
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
