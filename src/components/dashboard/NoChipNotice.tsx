/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Dashboard — Aviso de Chip No Vinculado
 * ARCHIVO: src/components/dashboard/NoChipNotice.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Cuando la cuenta del motociclista aún no tiene un folio SAFE vinculado, el
 * panel no puede limitarse a mostrar un guión: debe decirle a la persona, en
 * lenguaje humano, que escanee el código de su casco para activarlo. Enlaza al
 * formulario real de activación de la portada (/#activar); jamás inventa un
 * folio de ejemplo.
 *
 * ENTRADAS: ninguna (textos del diccionario bilingüe).
 * SALIDAS: navegación a la activación del kit físico.
 * DEPENDENCIAS: useLocale, useHaptic, IncidentCard, next/link.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero folios hardcodeados (nada de "SAFE-0001" ni "SAFE-XXXX").
 * - Táctiles ≥ 44px y paleta Incident sin gradientes.
 * ==============================================================================
 */

"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentCard } from "@/components/ui/IncidentCard";

/**
 * Aviso de ausencia de chip vinculado con acceso directo a la activación.
 */
export function NoChipNotice() {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  return (
    <IncidentCard variant="warning" padding="md" className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden="true">
          ⛑️
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-serif font-bold text-xl text-brand-navy-dark leading-tight">
            {t.dashboard.noChipTitle}
          </h2>
          <p className="font-sans text-xs text-brand-text-desc">
            {t.dashboard.noChipHelp}
          </p>
        </div>
      </div>

      <Link
        href="/#activar"
        onClick={() => triggerHaptic("light")}
        className="btn-neutral self-start no-underline font-bold"
      >
        {t.dashboard.noChipAction} →
      </Link>
    </IncidentCard>
  );
}
