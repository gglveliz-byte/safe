/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Tarjeta de Guía Móvil Android para Web NFC
 * ARCHIVO: src/components/admin/NfcAndroidGuideCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Explica la necesidad de Google Chrome en Android para Web NFC:
 * - En Desktop: Muestra el código QR para escanear la pantalla con el celular.
 * - En Móvil: Oculta el QR (el usuario ya está en su teléfono) y ofrece botón
 *   para copiar el enlace y abrirlo en Chrome Android.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 120 líneas).
 * - Cero textos en duro: 100% diccionario bilingüe vía useLocale().
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";

export interface NfcAndroidGuideCardProps {
  adminQrUrl: string;
  isMobile?: boolean;
  batchName?: string;
  totalChips?: number;
  onClose?: () => void;
}

export function NfcAndroidGuideCard({
  adminQrUrl,
  isMobile = false,
  batchName,
  totalChips,
  onClose,
}: NfcAndroidGuideCardProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(`${window.location.origin}/admin`);
        triggerHaptic("success");
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Ignora fallo de clipboard si el navegador no tiene permiso
    }
  };

  if (isMobile) {
    return (
      <div className="p-5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex flex-col items-center justify-center text-center gap-4 flex-1 my-auto shadow-xs">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl shadow-xs">
          📱
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h4 className="font-serif text-sm font-bold text-amber-950">
            {t.admin.nfcRequiresAndroid}
          </h4>
          <p className="font-sans text-xs text-amber-900 leading-relaxed">
            {t.admin.nfcMobileIosWarning}
          </p>
        </div>

        {batchName && (
          <div className="p-2.5 bg-white/90 border border-amber-200 rounded-xl w-full max-w-xs text-left">
            <p className="font-sans text-[11px] font-semibold text-brand-navy-dark">
              {t.admin.batchNameLabel}:{" "}
              <span className="font-mono text-brand-accent">{batchName}</span>
            </p>
            {typeof totalChips === "number" && totalChips > 0 && (
              <p className="font-sans text-[10px] text-brand-text-muted">
                {totalChips} {t.admin.totalKitsLabel}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full max-w-xs pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>📋</span>
            <span>
              {copied
                ? t.admin.adminUrlCopiedNotice
                : t.admin.nfcCopyLinkForAndroid}
            </span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[40px] inline-flex items-center justify-center px-4 py-2 bg-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              {t.common.cancel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200/90 rounded-xl flex flex-col items-center justify-between gap-2.5 text-center h-full">
      <div className="flex items-center gap-2">
        <span className="text-xl">📱</span>
        <strong className="font-serif text-xs sm:text-sm font-bold text-amber-950">
          {t.admin.nfcRequiresAndroid}
        </strong>
      </div>
      <p className="font-sans text-[11px] sm:text-xs text-amber-900 leading-relaxed max-w-sm">
        {t.admin.nfcOpenOnMobilePrompt}
      </p>
      {adminQrUrl ? (
        <div className="p-1.5 bg-white rounded-lg border border-amber-200 shadow-xs">
          <img
            src={adminQrUrl}
            alt="Admin Mobile QR"
            className="w-24 h-24 sm:w-28 sm:h-28 mx-auto"
          />
        </div>
      ) : (
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/60 animate-pulse rounded-lg border border-amber-200" />
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="text-[11px] font-sans font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded-md transition-colors cursor-pointer"
      >
        {copied ? t.admin.adminUrlCopiedNotice : t.admin.copyAdminUrlButton}
      </button>
    </div>
  );
}
