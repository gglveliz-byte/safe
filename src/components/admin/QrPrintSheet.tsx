/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Plancha de Impresión de Stickers QR
 * ARCHIVO: src/components/admin/QrPrintSheet.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la plancha de producción gráfica para imprimir códigos QR en serie.
 * Optimizado para papel vinílico adhesivo impermeable con resistencia a intemperie.
 * Muestra el folio secuencial, el código QR visual y la baliza Signal Orange.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Estilos @media print dedicados para impresión en imprenta sin elementos web.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentButton } from "@/components/ui/IncidentButton";
import type { AdminDeviceItem } from "@/lib/api-client";

export interface QrPrintSheetProps {
  batchName: string;
  devices: AdminDeviceItem[];
  onClose?: () => void;
}

export function QrPrintSheet({ batchName, devices, onClose }: QrPrintSheetProps) {
  const { t } = useLocale();

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="w-full bg-paper border border-ink rounded-[12px] p-6 shadow-incident">
      {/* Barra de Controles (Oculta en Impresión) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ink mb-6">
        <div>
          <h3 className="font-serif font-bold text-heading text-ink leading-tight">
            {t.admin.printSheetTitle}
          </h3>
          <p className="font-sans text-micro text-carbon mt-1">
            Lote: <strong className="text-ink">{batchName}</strong> ({devices.length} stickers)
          </p>
          <p className="font-sans text-[12px] text-carbon mt-0.5">
            {t.admin.printSheetHelp}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <IncidentButton variant="neutral" onClick={onClose}>
              {t.common.cancel}
            </IncidentButton>
          )}
          <IncidentButton variant="emergency" onClick={handlePrint}>
            🖨️ {t.admin.printQrsButton}
          </IncidentButton>
        </div>
      </div>

      {/* Cuadrícula de Stickers Imprimibles (3 columnas en papel broadsheet) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-6">
        {devices.map((device) => {
          const targetUrl = `https://safe.app/r/${device.code}?v=qr`;
          const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(targetUrl)}&margin=4`;

          return (
            <div
              key={device.code}
              className="p-3 border-2 border-ink rounded-[8px] bg-white flex flex-col items-center justify-between text-center select-none break-inside-avoid shadow-sm"
              style={{ minHeight: "220px" }}
            >
              {/* Encabezado del Sticker */}
              <div className="w-full flex items-center justify-between border-b border-ink pb-1 mb-2">
                <span className="font-serif font-bold text-body text-ink leading-none">
                  SAFE
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-signal-orange" />
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-carbon">
                  RESCATE
                </span>
              </div>

              {/* Imagen del Código QR Vectorial */}
              <div className="my-1 w-32 h-32 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSvgUrl}
                  alt={`QR ${device.code}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Folio y Clave de Activación Raspable */}
              <div className="w-full pt-1 border-t border-mist flex flex-col items-center">
                <span className="font-mono text-micro font-bold text-ink tracking-widest">
                  {device.code}
                </span>
                <span className="font-sans text-[10px] text-carbon">
                  PIN: <strong className="font-mono">{device.activationPin}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
