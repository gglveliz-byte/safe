/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Layout Compartido — Cromo Público vs. Consola Privada
 * ARCHIVO: src/components/layout/PublicChrome.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Decide qué cromo institucional se muestra alrededor del contenido según la
 * ruta activa. Las vistas públicas conservan la barra de navegación y el pie
 * legal de SAFE; las dos áreas privadas con sesión iniciada (/admin y
 * /dashboard) prescinden de ambos porque son herramientas cerradas y cada una
 * monta su propia barra en src/app/admin/layout.tsx y
 * src/app/dashboard/layout.tsx (ConsoleTopBar).
 *
 * ENTRADAS: children renderizados por el layout raíz y pathname activo.
 * SALIDAS: árbol con navbar + main + footer (público) o solo children (admin).
 * DEPENDENCIAS: next/navigation, IncidentNavbar, IncidentFooter.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos hardcodeados: los cromos consumen el diccionario bilingüe.
 * ==============================================================================
 */

"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { IncidentNavbar } from "@/components/ui/IncidentNavbar";
import { IncidentFooter } from "@/components/ui/IncidentFooter";

export interface PublicChromeProps {
  /** Contenido de la ruta activa entregado por el layout raíz. */
  children: React.ReactNode;
}

/** Rutas de las áreas privadas que montan su propia barra (ConsoleTopBar). */
const PRIVATE_AREAS = ["/admin", "/dashboard"] as const;

/**
 * Envuelve las vistas públicas con la navegación y el pie institucional.
 * En /admin y /dashboard devuelve únicamente el contenido: ambas son consolas
 * privadas con sesión iniciada y no deben exponer los enlaces de la web pública
 * ("Inicio", "Ingreso Piloto", "Activar mi Casco") ni los documentos legales
 * del pie, porque cada una trae su propia barra superior con logout.
 */
export function PublicChrome({ children }: PublicChromeProps) {
  const pathname = usePathname() || "";
  const isPrivateArea = PRIVATE_AREAS.some(
    (area) => pathname === area || pathname.startsWith(`${area}/`),
  );

  // Gestión de Service Worker en el cliente sin alterar el árbol SSR de hidratación
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      const handleLoad = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      };
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    } else {
      // En desarrollo desregistramos workers previos para evitar ChunkLoadError por HMR
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      });
    }
  }, []);

  if (isPrivateArea) {
    return <>{children}</>;
  }

  return (
    <>
      <IncidentNavbar />
      <main className="flex-1 w-full">{children}</main>
      <IncidentFooter />
    </>
  );
}
