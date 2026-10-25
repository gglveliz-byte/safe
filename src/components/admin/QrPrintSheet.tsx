/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Plancha de Impresión de Stickers QR
 * ARCHIVO: src/components/admin/QrPrintSheet.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la plancha de producción gráfica para imprimir códigos QR en serie.
 * Los códigos se generan 100% EN LOCAL y en memoria con el motor `qrcode`
 * (cero servicios de terceros, cero fuga de folios a APIs externas), codificando
 * la URL canónica del gateway del casco (NEXT_PUBLIC_APP_URL u origen actual
 * del navegador; jamás un dominio inventado). Optimizado para papel vinílico
 * adhesivo impermeable con resistencia a la intemperie.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Estilos @media print dedicados para impresión en imprenta sin elementos web.
 * - Paleta Incident estricta y textos 100% del diccionario bilingüe.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLocale } from "@/hooks/useLocale";
import { IncidentButton } from "@/components/ui/IncidentButton";
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

  // Generación local de toda la tira de stickers sin dependencias de terceros
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
                color: { dark: "#000000", light: "#ffffff" },
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
    <div className="w-full bg-paper border border-ink rounded-[12px] p-6 shadow-incident">
      {/* Barra de Controles (Oculta en Impresión) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ink mb-6">
        <div>
          <h3 className="font-serif font-bold text-heading text-ink leading-tight">
            {t.admin.printSheetTitle}
          </h3>
          <p className="font-sans text-micro text-carbon mt-1">
            {t.admin.batchNameLabel}:{" "}
            <strong className="text-ink">{batchName}</strong> · {devices.length}{" "}
            {t.admin.totalKitsLabel}
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

      {/* Aviso de fallo en la generación local (oculto al imprimir) */}
      {generationError && (
        <div className="no-print p-3 mb-6 bg-[rgba(255,73,44,0.08)] border border-alert-red rounded-[6px] text-micro text-alert-red font-sans text-center">
          ⚠️ {t.common.errorGeneric}
        </div>
      )}

      {/* Cuadrícula de Stickers Imprimibles (3 columnas en papel broadsheet) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-6">
        {devices.map((device) => (
          <div
            key={device.code}
            className="p-3 border-2 border-ink rounded-[8px] bg-paper flex flex-col items-center justify-between text-center select-none break-inside-avoid shadow-sm"
            style={{ minHeight: "220px" }}
          >
            {/* Encabezado del Sticker */}
            <div className="w-full flex items-center justify-between gap-1 border-b border-ink pb-1 mb-2">
              <span className="font-serif font-bold text-body text-ink leading-none">
                {t.common.appName}
              </span>
              <span className="w-2.5 h-2.5 flex-shrink-0 rounded-full bg-signal-orange" />
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-carbon leading-tight">
                {t.common.emergencyBadge}
              </span>
            </div>

            {/* Imagen del Código QR generado localmente (PNG en memoria) */}
            <div className="my-1 w-32 h-32 flex items-center justify-center">
              {qrDataUrls[device.code] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrls[device.code]}
                  alt={`${t.admin.printSheetTitle} — ${device.code}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                // Marcador punteado mientras concluye la generación en memoria
                <span
                  aria-hidden="true"
                  className="w-full h-full border border-dashed border-mist rounded-[4px]"
                />
              )}
            </div>

            {/* Folio y Clave de Activación Raspable */}
            <div className="w-full pt-1 border-t border-mist flex flex-col items-center">
              <span className="font-sans text-micro font-bold text-ink tracking-widest">
                {device.code}
              </span>
              <span className="font-sans text-[10px] text-carbon">
                PIN:{" "}
                <strong className="font-sans tracking-widest">
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
