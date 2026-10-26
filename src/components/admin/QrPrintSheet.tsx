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
import { buildHelmetGatewayClientUrl, resolvePublicBaseUrl } from "@/lib/nfc-write-utils";
import type { AdminDeviceItem } from "@/lib/api-client";

export interface QrPrintSheetProps {
  batchName: string;
  devices: AdminDeviceItem[];
  onClose?: () => void;
}

export function QrPrintSheet({ batchName, devices, onClose }: QrPrintSheetProps) {
  const { t } = useLocale();

  // URL base dinámica (auto-detectada de LAN / VPS con capacidad de ajuste)
  const [targetBaseUrl, setTargetBaseUrl] = useState(() => resolvePublicBaseUrl());
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState("");

  // Mapa folio → Data URL (PNG base64) del QR generado localmente en memoria
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [generationError, setGenerationError] = useState(false);

  // Auto-descubrimiento de la IP de red local cuando el navegador se encuentra en localhost
  useEffect(() => {
    let active = true;
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      fetch("/api/system/network-info")
        .then((res) => res.json())
        .then((payload) => {
          if (!active) return;
          if (payload.success && payload.data) {
            const detected =
              payload.data.envUrl && !payload.data.envUrl.includes("localhost")
                ? payload.data.envUrl
                : payload.data.lanUrl || "";
            if (detected) {
              setTargetBaseUrl(detected);
            }
          }
        })
        .catch(() => {
          // Ignorar fallo si el endpoint no responde
        });
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function generateLocalQrs() {
      try {
        const entries = await Promise.all(
          devices.map(async (device) => {
            const dataUrl = await QRCode.toDataURL(
              buildHelmetGatewayClientUrl(device.code, "qr", device.activationPin, targetBaseUrl),
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
  }, [devices, targetBaseUrl]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="qr-print-sheet w-full min-h-dvh sm:min-h-0 bg-brand-white border-0 sm:border border-brand-border-subtle rounded-none sm:rounded-2xl p-4 sm:p-8 shadow-none sm:shadow-2xl flex-1 flex flex-col">
      {/* Barra de Controles (Oculta en Impresión) - Sticky en la parte superior del modal */}
      <div className="no-print sticky top-0 z-20 bg-brand-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-brand-separator mb-4 sm:mb-6 pt-1">
        <div>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight">
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

          {/* Selector Inteligente de Enlace Base (LAN Wi-Fi / Dominio VPS) */}
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-brand-separator/60">
            <span className="font-sans text-xs text-brand-text-desc flex items-center gap-1">
              <span>🌐</span> Enlace base del kit:
            </span>
            {isEditingUrl ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                <input
                  type="text"
                  value={customInputUrl}
                  onChange={(e) => setCustomInputUrl(e.target.value)}
                  placeholder="https://tudominio.com o http://192.168.0.35:3000"
                  className="flex-1 px-2.5 py-1 text-xs font-mono bg-white border border-brand-border-field rounded-md text-brand-navy-dark focus:outline-none focus:ring-1 focus:ring-brand-nav-blue"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customInputUrl.trim()) {
                      setTargetBaseUrl(customInputUrl.trim());
                    }
                    setIsEditingUrl(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-brand-navy-dark text-white rounded-md cursor-pointer hover:bg-brand-navy-secondary transition-colors"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(false)}
                  className="px-2 py-1 text-xs text-brand-text-muted hover:text-brand-navy-dark cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs font-bold text-brand-navy-dark bg-brand-bg-alt px-2 py-0.5 rounded border border-brand-border-subtle">
                  {targetBaseUrl}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    setCustomInputUrl(targetBaseUrl);
                    setIsEditingUrl(true);
                  }}
                  className="text-xs text-brand-nav-blue hover:underline cursor-pointer font-medium"
                >
                  Cambiar para VPS / Dominio
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark font-sans text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer text-center"
            >
              {t.common.cancel}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white font-sans text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer text-center"
          >
            <span>🖨️</span>
            {t.admin.printQrsButton}
          </button>
        </div>
      </div>

      {/* Aviso de fallo en la generación local (oculto al imprimir) */}
      {generationError && (
        <div className="no-print p-3 mb-4 sm:mb-6 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium">
          ⚠️ {t.common.errorGeneric}
        </div>
      )}

      {/* Cuadrícula de Stickers Imprimibles (3 columnas en papel broadsheet, hasta 5 en pantalla grande) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 print:grid-cols-3 print:gap-6 flex-1 pb-16 sm:pb-8">
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
