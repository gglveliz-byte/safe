/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Vista Previa del Kit NFC/QR
 * ARCHIVO: src/components/admin/NfcKitPreviewCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la tarjeta visual del folio y su código QR generado localmente.
 * Soporta modo normal (desktop) y modo compacto (móvil sin scroll vertical).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 90 líneas).
 * - Cero textos en duro: 100% diccionario bilingüe vía useLocale().
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";

export interface NfcKitPreviewCardProps {
  code: string;
  qrDataUrl: string;
  currentIndex: number;
  totalChips: number;
  compact?: boolean;
}

export function NfcKitPreviewCard({
  code,
  qrDataUrl,
  currentIndex,
  totalChips,
  compact = false,
}: NfcKitPreviewCardProps) {
  const { t } = useLocale();

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 p-2.5 bg-brand-white border border-brand-border-subtle rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={code}
              className="w-10 h-10 bg-brand-white p-0.5 rounded-lg border border-brand-border-field shadow-xs shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-brand-bg-alt rounded-lg animate-pulse shrink-0" />
          )}

          <div className="flex flex-col min-w-0">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
              #{currentIndex + 1} de {totalChips}
            </span>
            <span className="font-mono text-base font-bold text-brand-navy-dark tracking-wide truncate">
              {code}
            </span>
          </div>
        </div>

        <span className="shrink-0 font-sans text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          {t.admin.readyForContact}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Tarjeta Visual del Kit y QR en Desktop */}
      <div className="flex items-center gap-3 p-3 bg-brand-white border border-brand-border-subtle rounded-xl shadow-xs">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={code}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-white p-1 rounded-lg border border-brand-border-field shadow-xs shrink-0"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-bg-alt rounded-lg animate-pulse shrink-0" />
        )}

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
            {t.admin.columnChip} #{currentIndex + 1} de {totalChips}
          </span>
          <span className="font-mono text-base sm:text-lg font-bold text-brand-navy-dark tracking-wide truncate">
            {code}
          </span>
          <span className="font-sans text-[11px] text-brand-text-desc leading-snug line-clamp-2">
            {t.admin.nfcAssigningInstruction}
          </span>
        </div>
      </div>

      {/* Consejo didáctico: teléfono acostado */}
      <div className="p-2.5 bg-brand-nav-active border border-brand-nav-blue/25 rounded-lg text-xs font-sans text-brand-navy-dark flex items-start gap-2">
        <span className="text-sm shrink-0">💡</span>
        <p className="leading-snug text-[11px] text-brand-navy-dark">
          {t.admin.nfcPositionTip}
        </p>
      </div>
    </div>
  );
}
