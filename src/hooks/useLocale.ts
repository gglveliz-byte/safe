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

/**
 * Estado global en memoria para sincronización reactiva instantánea entre
 * todos los componentes montados en el árbol de React (Navbar, Vistas, Footer).
 */
let currentGlobalLocale: Locale = "es";
let isLocaleInitialized = false;
const listeners = new Set<(next: Locale) => void>();

/** Notifica el cambio de idioma a todos los componentes suscriptores en la misma ventana. */
function notifyLocaleSubscribers(newLocale: Locale) {
  currentGlobalLocale = newLocale;
  listeners.forEach((listener) => {
    try {
      listener(newLocale);
    } catch {
      // Proteger la ejecución de los demás listeners si uno falla
    }
  });
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(() =>
    isLocaleInitialized ? currentGlobalLocale : "es"
  );
  const [mounted, setMounted] = useState<boolean>(false);

  // Inicialización y sincronización en cliente
  useEffect(() => {
    setMounted(true);

    // Leer preferencia guardada en el primer montaje en cliente
    if (!isLocaleInitialized) {
      isLocaleInitialized = true;
      try {
        const stored = localStorage.getItem("safe_locale") as Locale | null;
        if (stored === "es" || stored === "en") {
          currentGlobalLocale = stored;
        } else if (typeof navigator !== "undefined" && navigator.language) {
          const lang = navigator.language.toLowerCase();
          if (lang.startsWith("en")) {
            currentGlobalLocale = "en";
          }
        }
      } catch {
        // Entornos donde localStorage esté restringido
      }
    }

    // Asegurar que el estado local coincida con el global actual
    if (locale !== currentGlobalLocale) {
      setLocaleState(currentGlobalLocale);
    }

    // Suscribir este componente a los cambios emitidos por cualquier conmutador (ej: IncidentNavbar)
    const handleUpdate = (nextLocale: Locale) => {
      setLocaleState(nextLocale);
    };
    listeners.add(handleUpdate);

    // Escuchar cambios de localStorage originados en otras pestañas del navegador
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "safe_locale" &&
        (event.newValue === "es" || event.newValue === "en")
      ) {
        notifyLocaleSubscribers(event.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      listeners.delete(handleUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [locale]);

  // Conmutador en 1 toque: propaga el cambio a TODOS los componentes instantáneamente
  const toggleLocale = useCallback(() => {
    const nextLocale: Locale = currentGlobalLocale === "es" ? "en" : "es";
    try {
      localStorage.setItem("safe_locale", nextLocale);
      document.cookie = `safe_locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignorar fallos de almacenamiento
    }
    notifyLocaleSubscribers(nextLocale);
  }, []);

  // Fijación manual de idioma: propaga el cambio a TODOS los componentes instantáneamente
  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale === currentGlobalLocale) return;
    try {
      localStorage.setItem("safe_locale", newLocale);
      document.cookie = `safe_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignorar fallos de almacenamiento
    }
    notifyLocaleSubscribers(newLocale);
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
