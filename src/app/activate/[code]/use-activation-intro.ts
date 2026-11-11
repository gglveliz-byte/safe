/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Activación — Hook de Control del Video de Primera Vez
 * ARCHIVO: src/app/activate/[code]/use-activation-intro.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Coordina la visualización del video introductorio únicamente en el primer
 * escaneo QR/NFC de un kit virgen, esperando que el modal de idioma inicial
 * se cierre (para no solapar ventanas) y ocultándose de forma definitiva una
 * vez el piloto avanza al formulario o ya tiene su registro en curso.
 * ==============================================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";

const LANG_MODAL_STORAGE_KEY = "altus_first_visit_lang_selected";

export function useActivationIntro(
  code: string,
  sessionChecked: boolean,
  isRegistered: boolean,
) {
  const storageKey = `altus_intro_seen_${code}`;
  const [langReady, setLangReady] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey) === "true") {
        setIntroDismissed(true);
      }
      if (localStorage.getItem(LANG_MODAL_STORAGE_KEY)) {
        setLangReady(true);
      }
    } catch {
      // Fallback seguro si storage está bloqueado
      setLangReady(true);
    }

    const handleLangClosed = () => setLangReady(true);
    window.addEventListener("altus:lang-modal-closed", handleLangClosed);
    return () => {
      window.removeEventListener("altus:lang-modal-closed", handleLangClosed);
    };
  }, [storageKey]);

  const dismissIntro = useCallback(() => {
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // Ignorar en navegación privada estricta
    }
    setIntroDismissed(true);
  }, [storageKey]);

  const replayIntro = useCallback(() => {
    setIntroDismissed(false);
  }, []);

  const waitingForLanguage = !langReady && !isRegistered && !introDismissed;
  const showIntroVideo =
    sessionChecked && langReady && !isRegistered && !introDismissed;

  return {
    waitingForLanguage,
    showIntroVideo,
    dismissIntro,
    replayIntro,
  };
}
