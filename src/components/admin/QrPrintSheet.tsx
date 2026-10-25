/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Plancha de Impresión de Stickers QR
 * ARCHIVO: src/components/admin/QrPrintSheet.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la plancha de producción gráfica para imprimir códigos QR en serie
 * bajo la estética SAFE 2026. Los códigos se generan 100% en local con el motor
 * qrcode. Optimizado para papel vinílico adhesivo impermeable con resistencia a
 * la intemperie y corte en imprenta.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Estilos @media print dedicados para impresión en papel sin elementos web.
 * - Paleta SAFE 2026 y textos 100% del diccionario bilingüe.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLocale } from "@/hooks/useLocale";
import { buildHelmetGatewayClientUrl } from "@/lib/nfc-write-utils";
import type { AdminDeviceItem } from "@/lib/api-client";

export interface QrPrintSheetProps {
  batchName: string;
  devices: AdminDeviceItem[];
  onClose?: () => void;
}

export function QrPrintSheet({ batchName, devices, onClose }: QrPrintSheetProps) {
  const { t } = useLocale();

  // Mapa folio → Data URL (PNG base64) del QR generado localmente en memoria
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [generationError, setGenerationError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generateLocalQrs() {
      try {
        const entries = await Promise.all(
          devices.map(async (device) => {
            const dataUrl = await QRCode.toDataURL(
              buildHelmetGatewayClientUrl(device.code, "qr"),
              {
                width: 300,
                margin: 1,
                errorCorrectionLevel: "M",
                color: { dark: "#0B1F3A", light: "#FFFFFF" },
              },
            );
            return [device.code, dataUrl] as const;
          }),
        );
        if (!cancelled) {
          setQrDataUrls(Object.fromEntries(entries));
          setGenerationError(false);
        }
      } catch (err: unknown) {
        console.error("[QR] Falló la generación local de la plancha:", err);
        if (!cancelled) setGenerationError(true);
      }
    }

    if (devices.length > 0) {
      void generateLocalQrs();
    }
    return () => {
      cancelled = true;
    };
  }, [devices]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="qr-print-sheet w-full bg-brand-white border border-brand-border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl">
      {/* Barra de Controles (Oculta en Impresión) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-brand-separator mb-6">
        <div>
          <h3 className="font-serif font-bold text-2xl text-brand-navy-dark leading-tight">
            {t.admin.printSheetTitle}
          </h3>
          <p className="font-sans text-xs sm:text-sm text-brand-text-desc mt-1">
            {t.admin.batchNameLabel}:{" "}
            <strong className="text-brand-navy-dark font-mono font-bold">{batchName}</strong> ·{" "}
            {devices.length} {t.admin.totalKitsLabel}
          </p>
          <p className="font-sans text-xs text-brand-text-muted mt-0.5">
            {t.admin.printSheetHelp}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark font-sans text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
            >
              {t.common.cancel}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white font-sans text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
          >
            <span>🖨️</span>
            {t.admin.printQrsButton}
          </button>
        </div>
      </div>

      {/* Aviso de fallo en la generación local (oculto al imprimir) */}
      {generationError && (
        <div className="no-print p-3 mb-6 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium">
          ⚠️ {t.common.errorGeneric}
        </div>
      )}

      {/* Cuadrícula de Stickers Imprimibles (3 columnas en papel broadsheet) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-6">
        {devices.map((device) => (
          <div
            key={device.code}
            className="p-3.5 border-2 border-brand-navy-dark rounded-xl bg-brand-white flex flex-col items-center justify-between text-center select-none break-inside-avoid shadow-sm"
            style={{ minHeight: "220px" }}
          >
            {/* Encabezado del Sticker */}
            <div className="w-full flex items-center justify-between gap-1 border-b border-brand-separator pb-1.5 mb-2">
              <span className="font-serif font-bold text-sm text-brand-navy-dark leading-none">
                {t.common.appName}
              </span>
              <span className="w-2 h-2 flex-shrink-0 rounded-full bg-brand-accent" />
              <span className="font-sans text-[9px] font-bold uppercase tracking-wider text-brand-text-muted leading-tight">
                {t.common.emergencyBadge}
              </span>
            </div>

            {/* Imagen del Código QR generado localmente */}
            <div className="my-1.5 w-32 h-32 flex items-center justify-center">
              {qrDataUrls[device.code] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrls[device.code]}
                  alt={`${t.admin.printSheetTitle} — ${device.code}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="w-full h-full border border-dashed border-brand-border-subtle rounded-md"
                />
              )}
            </div>

            {/* Folio y Clave de Activación Raspable */}
            <div className="w-full pt-1.5 border-t border-brand-separator flex flex-col items-center">
              <span className="font-mono text-xs font-bold text-brand-navy-dark tracking-widest">
                {device.code}
              </span>
              <span className="font-sans text-[10px] text-brand-text-desc mt-0.5">
                {t.admin.pinLabel}:{" "}
                <strong className="font-mono tracking-widest font-semibold text-brand-navy-dark">
                  {device.activationPin}
                </strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
