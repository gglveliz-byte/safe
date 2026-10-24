/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Hooks Móviles Nativos — Prevención de Suspensión de Pantalla (WakeLock)
 * ARCHIVO: src/hooks/useWakeLock.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Administra el estado de la Screen WakeLock API durante el 'Modo Ruta' del motociclista.
 * Evita que el sistema operativo del teléfono apague la pantalla y congele la captura
 * satelital del GPS mientras el conductor rueda con el móvil en el manillar.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Reconexión automática al volver del segundo plano si la visibilidad cambia.
 * ==============================================================================
 */

"use client";

import { useEffect, useState, useRef } from "react";

export function useWakeLock(isActive: boolean) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  // Sentinel de bloqueo en referencia mutable
  const wakeLockSentinelRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      setIsSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !isActive) {
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
        setIsLocked(false);
      }
      return;
    }

    let isMounted = true;

    async function requestScreenLock() {
      try {
        if ("wakeLock" in navigator) {
          const sentinel = await (navigator as any).wakeLock.request("screen");
          if (isMounted) {
            wakeLockSentinelRef.current = sentinel;
            setIsLocked(true);

            sentinel.addEventListener("release", () => {
              if (isMounted) {
                setIsLocked(false);
              }
            });
          }
        }
      } catch (err) {
        // Puede ocurrir si la batería está en modo de ultra ahorro o la pestaña está oculta
        if (isMounted) {
          setIsLocked(false);
        }
      }
    }

    requestScreenLock();

    // Re-adquisición si el usuario minimizó y volvió a abrir el navegador
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActive) {
        requestScreenLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
      }
      setIsLocked(false);
    };
  }, [isActive, isSupported]);

  return { isSupported, isLocked };
}
