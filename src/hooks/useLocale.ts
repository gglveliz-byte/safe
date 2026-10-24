/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Hooks Móviles Nativos — Selector de Idioma Dinámico
 * ARCHIVO: src/hooks/useLocale.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Hook React de cliente para gestionar el idioma activo (Español / Inglés).
 * Detecta la preferencia guardada en localStorage o cookies, o el idioma del navegador.
 * Permite la conmutación instantánea en 1 toque desde la barra de navegación.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero texto hardcodeado.
 * ==============================================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { type Locale, type Dictionary, getDictionary } from "@/locales";

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [mounted, setMounted] = useState<boolean>(false);

  // Inicialización en cliente con detección de preferencia
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("safe_locale") as Locale | null;
      if (stored === "es" || stored === "en") {
        setLocaleState(stored);
        return;
      }
      // Detección por navegador si no hay preferencia previa
      if (typeof navigator !== "undefined" && navigator.language) {
        const lang = navigator.language.toLowerCase();
        if (lang.startsWith("en")) {
          setLocaleState("en");
          return;
        }
      }
    } catch {
      // Entornos donde localStorage esté bloqueado
    }
  }, []);

  // Conmutador en 1 toque
  const toggleLocale = useCallback(() => {
    const nextLocale: Locale = locale === "es" ? "en" : "es";
    setLocaleState(nextLocale);
    try {
      localStorage.setItem("safe_locale", nextLocale);
      document.cookie = `safe_locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignorar fallos de almacenamiento
    }
  }, [locale]);

  // Fijación manual de idioma
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("safe_locale", newLocale);
      document.cookie = `safe_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignorar fallos de almacenamiento
    }
  }, []);

  const t: Dictionary = getDictionary(locale);

  return {
    locale,
    t,
    toggleLocale,
    setLocale,
    isReady: mounted,
  };
}
