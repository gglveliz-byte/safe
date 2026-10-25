/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Esqueleto de Carga Inicial (SAFE 2026)
 * ARCHIVO: src/components/admin/AdminSkeleton.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Estado de carga del panel de administración mientras se verifica la sesión
 * y se consultan los lotes de producción con el diseño SAFE 2026.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Cero datos hardcodeados o demos.
 * - 100% bilingüe vía props.
 * ==============================================================================
 */

"use client";

import React from "react";

export interface AdminSkeletonProps {
  title: string;
  subtitle: string;
}

export function AdminSkeleton({ title, subtitle }: AdminSkeletonProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fadeInUp">
      <div className="w-full max-w-md bg-brand-white border border-brand-border-subtle rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-sm">
        <span
          className="w-4 h-4 rounded-full bg-brand-accent animate-ping"
          aria-hidden="true"
        />
        <h2
          className="font-serif text-2xl font-bold text-brand-navy-dark leading-tight"
          role="status"
          aria-live="polite"
        >
          {title}
        </h2>
        <p className="font-sans text-xs text-brand-text-desc">{subtitle}</p>
      </div>
    </div>
  );
}
