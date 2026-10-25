/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Esqueleto de Carga Inicial
 * ARCHIVO: src/components/admin/AdminSkeleton.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Estado de carga del panel de administración mientras se verifica la sesión
 * y se consultan los lotes de producción. Extraído de src/app/admin/page.tsx
 * para cumplir el límite estricto de líneas por archivo (partición obligatoria
 * de la zona crítica 451-500). El texto llega SIEMPRE por props desde el
 * diccionario bilingüe (cero texto hardcodeado, regla 12).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados o demos.
 * - Diseño Incident: tarjeta de papel sobre concreto, baliza signal-orange.
 * ==============================================================================
 */

"use client";

import React from "react";
import { IncidentCard } from "@/components/ui/IncidentCard";

/** Props del esqueleto: textos humanos resueltos por la vista padre desde el diccionario. */
export interface AdminSkeletonProps {
  /** Título humano de la sección (t.admin.title). */
  title: string;
  /** Subtítulo humano de la sección (t.admin.subtitle). */
  subtitle: string;
}

/**
 * Esqueleto broadsheet de carga inicial del panel de administración.
 * Marca con role="status" y aria-live para lectores de pantalla.
 */
export function AdminSkeleton({ title, subtitle }: AdminSkeletonProps) {
  return (
    <div className="safe-mobile-container py-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <IncidentCard
        padding="lg"
        className="w-full max-w-md text-center flex flex-col items-center gap-3"
      >
        {/* Baliza de actividad en Signal Orange (único acento cromático permitido) */}
        <span
          className="w-4 h-4 rounded-full bg-signal-orange animate-ping"
          aria-hidden="true"
        />
        <h2
          className="font-serif text-xl font-bold text-ink"
          role="status"
          aria-live="polite"
        >
          {title}
        </h2>
        <p className="font-sans text-micro text-carbon">{subtitle}</p>
      </IncidentCard>
    </div>
  );
}
