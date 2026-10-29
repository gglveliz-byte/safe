/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Plancha de Impresión de Stickers QR
 * ARCHIVO: src/components/admin/QrPrintSheet.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la plancha de producción gráfica para imprimir códigos QR en serie
 * bajo la estética SAFE 2026. Los códigos se generan 100% en local con el motor
 * qrcode. Emplea un React Portal montado en document.body (#qr-print-portal)
 * para garantizar aislamiento visual total en PC y descarte estricto de cualquier
 * elemento del panel administrativo en @media print / PDF.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Estilos @media print dedicados para impresión en papel sin elementos web.
 * - Paleta SAFE 2026 y textos 100% del diccionario bilingüe.
 * ==============================================================================
 */

"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

  // Control de montaje en cliente para creación segura del Portal
  const [isMounted, setIsMounted] = useState(false);

  // URL base dinámica (auto-detectada de LAN / VPS con capacidad de ajuste)
  const [targetBaseUrl, setTargetBaseUrl] = useState(() => resolvePublicBaseUrl());
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState("");

  // Mapa folio → Data URL (PNG base64) del QR generado localmente en memoria
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [generationError, setGenerationError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cierre accesible con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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

  // Generación local en memoria de los códigos QR sin tocar la base de datos
  useEffect(() => {
    let cancelled = false;

    async function generateLocalQrs() {
      try {
        const entries = await Promise.all(
          devices.map(async (device) => {
            const dataUrl = await QRCode.toDataURL(
              buildHelmetGatewayClientUrl(device.code, "qr", targetBaseUrl),
              {
                width: 320,
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  if (!isMounted) return null;

  const content = (
    <div
      id="qr-print-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-sheet-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] bg-brand-navy-dark/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
    >
      <div className="qr-modal-card relative w-full max-w-5xl max-h-[94vh] bg-brand-white rounded-2xl shadow-2xl border border-brand-border-subtle flex flex-col overflow-hidden my-auto animate-fadeInUp">
        {/* Barra Superior Editorial (Oculta en Impresión) */}
        <header className="no-print p-4 sm:p-6 border-b border-brand-separator bg-brand-white flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" aria-hidden="true" />
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                  {t.common.adminPanel} · {t.admin.printSheetTitle}
                </span>
              </div>
              <h2 id="qr-sheet-title" className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight">
                {t.admin.printSheetTitle}
              </h2>
              <p className="font-sans text-xs sm:text-sm text-brand-text-desc mt-0.5">
                {t.admin.batchNameLabel}:{" "}
                <strong className="text-brand-navy-dark font-mono font-bold">{batchName}</strong> ·{" "}
                {devices.length} {t.admin.totalKitsLabel}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial min-h-[42px] px-4 py-2 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark font-sans text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer text-center"
                >
                  {t.common.cancel}
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white font-sans text-xs font-bold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer text-center"
              >
                <span>🖨️</span>
                <span>{t.admin.printQrsButton}</span>
              </button>
            </div>
          </div>

          {/* Selector Inteligente de Enlace Base (LAN Wi-Fi / Dominio VPS) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-brand-separator/60">
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
        </header>

        {/* Cuerpo Desplazable de la Plancha de Stickers */}
        <div className="qr-modal-body p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-brand-bg-alt/40">
          {/* Aviso de fallo si hubiere */}
          {generationError && (
            <div className="no-print p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium">
              ⚠️ {t.common.errorGeneric}
            </div>
          )}

          {/* Guía rápida para el operador */}
          <div className="no-print p-3 sm:p-3.5 bg-brand-nav-active border border-brand-nav-blue/20 rounded-xl flex items-start sm:items-center gap-2.5 text-xs text-brand-navy-dark">
            <span className="text-base select-none">💡</span>
            <p className="leading-relaxed">
              <strong>Instrucciones de Impresión / PDF:</strong> Presiona el botón <strong>&quot;{t.admin.printQrsButton}&quot;</strong> y en el diálogo del navegador selecciona <em>&quot;Guardar como PDF&quot;</em> o envía a tu impresora de papel adhesivo. La hoja está formateada en <strong>3 columnas simétricas</strong> sin desbordamientos.
            </p>
          </div>

          {/* Cuadrícula Canónica de Stickers Imprimibles (3 columnas en PC y en papel) */}
          <div className="qr-stickers-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 flex-1">
            {devices.map((device) => (
              <div
                key={device.code}
                className="qr-sticker-item p-4 border-2 border-brand-navy-dark rounded-xl bg-brand-white flex flex-col items-center justify-between text-center select-none shadow-xs"
                style={{ minHeight: "230px" }}
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

                {/* Código QR generado localmente */}
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
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
