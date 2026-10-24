/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Hooks Móviles Nativos — Vibración Háptica Táctil
 * ARCHIVO: src/hooks/useHaptic.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Provee retroalimentación sensorial háptica a través de la Web Vibration API.
 * Indispensable para confirmar toques en carretera con guantes, advertencias
 * de siniestro vial y confirmación de grabación NFC en serie.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Patrones oficiales definidos en la skill safe-mobile-native-feel.
 * ==============================================================================
 */

"use client";

import { useCallback } from "react";

export type HapticPattern = "light" | "success" | "warning" | "error";

export function useHaptic() {
  const triggerHaptic = useCallback((pattern: HapticPattern = "light") => {
    if (typeof window === "undefined" || !("vibrate" in navigator)) {
      return;
    }

    try {
      switch (pattern) {
        case "light":
          // Toque sutil de confirmación de botón (40ms)
          navigator.vibrate(40);
          break;
        case "success":
          // Confirmación de guardado médico o chip grabado ([60ms, pausa 40ms, 80ms])
          navigator.vibrate([60, 40, 80]);
          break;
        case "warning":
          // Alerta preventiva o advertencia de GPS ([100ms, pausa 50ms, 100ms])
          navigator.vibrate([100, 50, 100]);
          break;
        case "error":
          // Error de validación o PIN incorrecto ([150ms, 80ms, 150ms, 80ms, 200ms])
          navigator.vibrate([150, 80, 150, 80, 200]);
          break;
      }
    } catch {
      // Ignorar dispositivos donde el usuario haya desactivado la vibración en el sistema
    }
  }, []);

  return { triggerHaptic };
}
