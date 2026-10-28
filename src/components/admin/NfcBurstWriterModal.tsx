/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Grabador y Limpiador NFC en Ráfaga
 * ARCHIVO: src/components/admin/NfcBurstWriterModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal ergonómico para codificación y formateo a fábrica de chips NFC de cascos:
 * - En PC: Presentación horizontal amplia en 2 columnas (sin scroll vertical).
 * - En Móvil: Presentación ultra-compacta (<380px) diseñada para no scrollear
 *   con el teléfono acostado en la mesa de trabajo.
 * - Web NFC API real (Google Chrome en Android) con avance continuo en ráfaga.
 * - Generación local de códigos QR oficiales y código de escaneo para abrir en celular.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 420 líneas).
 * - Cero simuladores ni datos hardcodeados: 100% diccionario bilingüe vía useLocale().
 * - Objetivos táctiles mínimos de 44x44px.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient, type AdminDeviceItem } from "@/lib/api-client";
import {
  buildHelmetGatewayClientUrl,
  buildUpdatedDevice,
  describeNfcError,
  detectNfcEnvironment,
  generateLocalQrDataUrl,
  generateAdminUrlQr,
  wipeNfcPhysicalChip,
  type EncodeNfcResult,
  type NdefReaderLike,
  type NdefReadingEventLike,
} from "@/lib/nfc-write-utils";
import { NfcAndroidGuideCard } from "@/components/admin/NfcAndroidGuideCard";
import { NfcKitPreviewCard } from "@/components/admin/NfcKitPreviewCard";

export interface NfcBurstWriterModalProps {
  device: AdminDeviceItem;
  devices?: AdminDeviceItem[];
  batchName?: string;
  onProgress?: (
    index: number,
    total: number,
    updatedDevice: AdminDeviceItem,
  ) => void;
  onSuccess: (updatedDevice: AdminDeviceItem) => void;
  onClose: () => void;
  initialMode?: "write" | "wipe";
}

export function NfcBurstWriterModal({
  device,
  devices,
  batchName,
  onProgress,
  onSuccess,
  onClose,
  initialMode = "write",
}: NfcBurstWriterModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const strip = useMemo(() => (devices && devices.length > 0 ? devices : [device]), [devices, device]);
  const initialIndex = useMemo(() => {
    const found = strip.findIndex((item) => item.code === device.code);
    return found >= 0 ? found : 0;
  }, [strip, device.code]);

  const [mode, setMode] = useState<"write" | "wipe">(initialMode);
  const [isSupported, setIsSupported] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [lockReadOnly, setLockReadOnly] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [wipedCount, setWipedCount] = useState(0);
  const [activeQrDataUrl, setActiveQrDataUrl] = useState("");
  const [adminQrUrl, setAdminQrUrl] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const stripRef = useRef(strip);
  const indexRef = useRef(initialIndex);
  const lockRef = useRef(lockReadOnly);
  const lastPhysicalUidRef = useRef("");
  const isProcessingRef = useRef(false);
  const cancelledRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    stripRef.current = strip;
    lockRef.current = lockReadOnly;
    onProgressRef.current = onProgress;
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    indexRef.current = initialIndex;
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const env = detectNfcEnvironment();
    setIsSupported(env.isSupported);
    const mobileDevice =
      !env.isDesktop ||
      (typeof window !== "undefined" && window.innerWidth < 768);
    setIsMobile(mobileDevice);
    if (!env.isSupported) {
      void generateAdminUrlQr("/admin", 160).then(setAdminQrUrl);
    }
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const activeDevice = strip[Math.min(currentIndex, strip.length - 1)] ?? device;
  useEffect(() => {
    if (activeDevice?.code) void generateLocalQrDataUrl(activeDevice.code, 160).then(setActiveQrDataUrl);
  }, [activeDevice?.code]);

  const handleChipReading = useCallback(
    async (ndef: NdefReaderLike, serialNumber: string) => {
      if (cancelledRef.current || isProcessingRef.current) return;
      const uid = (serialNumber || "").trim();
      if (!uid || uid === lastPhysicalUidRef.current) return;

      isProcessingRef.current = true;
      const index = indexRef.current;
      const target = stripRef.current[index];
      if (!target) {
        isProcessingRef.current = false;
        return;
      }

      setErrorMessage("");
      setStatusMessage(t.admin.nfcStepWriting);

      try {
        await ndef.write({
          records: [
            {
              recordType: "url",
              data: buildHelmetGatewayClientUrl(target.code, "nfc"),
            },
          ],
        });

        if (lockRef.current && typeof ndef.makeReadOnly === "function") {
          await ndef.makeReadOnly();
        }

        const result = (await apiClient.recordNfcWrite({
          code: target.code,
          nfcSerialNumber: uid,
          isLockedReadOnly: lockRef.current,
        })) as EncodeNfcResult;

        lastPhysicalUidRef.current = uid;
        const updated = buildUpdatedDevice(target, result.device ?? {}, uid);

        triggerHaptic("success");
        onProgressRef.current?.(index, stripRef.current.length, updated);

        const total = stripRef.current.length;
        if (index + 1 >= total) {
          setIsCompleted(true);
          setStatusMessage(t.admin.nfcBatchCompletedTitle);
          onSuccessRef.current(updated);
        } else {
          indexRef.current = index + 1;
          setCurrentIndex(index + 1);
          setStatusMessage(t.admin.nfcStepSuccessNext);
        }
      } catch (err: unknown) {
        triggerHaptic("error");
        setErrorMessage(
          describeNfcError(err, t.admin.nfcError, t.admin.nfcChipLockedError),
        );
      } finally {
        isProcessingRef.current = false;
      }
    },
    [t, triggerHaptic],
  );

  const handleWipeReading = useCallback(
    async (ndef: NdefReaderLike, serialNumber: string) => {
      if (cancelledRef.current || isProcessingRef.current) return;
      const uid = (serialNumber || "").trim();
      if (!uid || uid === lastPhysicalUidRef.current) return;

      isProcessingRef.current = true;
      setErrorMessage("");
      setStatusMessage(t.admin.nfcStepWriting);

      try {
        const res = await wipeNfcPhysicalChip(ndef);
        if (res.success) {
          lastPhysicalUidRef.current = uid;
          triggerHaptic("success");
          setStatusMessage(t.admin.nfcWipeSuccess);
          setWipedCount((c) => c + 1);
        } else if (res.isLocked) {
          triggerHaptic("error");
          setErrorMessage(t.admin.nfcChipLockedError);
        } else {
          triggerHaptic("error");
          setErrorMessage(res.error || t.admin.nfcError);
        }
      } catch (err: unknown) {
        triggerHaptic("error");
        setErrorMessage(
          describeNfcError(err, t.admin.nfcError, t.admin.nfcChipLockedError),
        );
      } finally {
        isProcessingRef.current = false;
      }
    },
    [t, triggerHaptic],
  );

  const handleStartSession = useCallback(async () => {
    setErrorMessage("");
    setStatusMessage(t.admin.scanningNfc);
    setIsWriting(true);
    triggerHaptic("light");
    lastPhysicalUidRef.current = "";
    isProcessingRef.current = false;
    cancelledRef.current = false;

    try {
      const NDEFReaderClass = (
        window as unknown as { NDEFReader: new () => NdefReaderLike }
      ).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.scan();

      ndef.onreading = (event: NdefReadingEventLike) => {
        if (mode === "write") {
          void handleChipReading(ndef, event.serialNumber);
        } else {
          void handleWipeReading(ndef, event.serialNumber);
        }
      };
      ndef.onreadingerror = () => {
        if (cancelledRef.current || isProcessingRef.current) return;
        triggerHaptic("error");
        setErrorMessage(t.admin.nfcError);
      };
    } catch (err: unknown) {
      triggerHaptic("error");
      setIsWriting(false);
      setErrorMessage(
        describeNfcError(err, t.admin.nfcError, t.admin.nfcChipLockedError),
      );
    }
  }, [mode, t, triggerHaptic, handleChipReading, handleWipeReading]);

  const progressPercent = Math.min(
    100,
    Math.round(((currentIndex + 1) / strip.length) * 100),
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="nfc-writer-title" className="fixed inset-0 z-50 bg-brand-white sm:bg-brand-navy-dark/90 sm:backdrop-blur-md flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 overflow-y-auto">
      <div className="w-full min-h-dvh sm:min-h-0 sm:max-w-4xl lg:max-w-5xl my-0 sm:my-auto bg-brand-white sm:border sm:border-brand-border-subtle rounded-none sm:rounded-2xl p-4 sm:p-5 sm:shadow-2xl flex flex-col justify-between sm:justify-start gap-3">
        {/* Barra superior de título, selector de modo y cierre */}
        <div className="flex items-center justify-between border-b border-brand-separator pb-2.5">
          <div className="flex items-center gap-2">
            <h3 id="nfc-writer-title" className="font-serif font-bold text-sm sm:text-lg text-brand-navy-dark leading-tight">
              {t.admin.nfcWriterTitle}
            </h3>
            <span className="hidden sm:inline font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted bg-brand-bg-alt px-2 py-0.5 rounded border border-brand-border-subtle">
              SAFE 2026 Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Modo */}
            <div className="inline-flex bg-brand-bg-alt p-0.5 rounded-lg border border-brand-border-subtle text-xs">
              <button
                type="button"
                disabled={isWriting}
                onClick={() => { setMode("write"); setIsCompleted(false); }}
                className={`py-1 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mode === "write"
                    ? "bg-brand-white text-brand-navy-dark shadow-xs"
                    : "text-brand-text-muted hover:text-brand-navy-dark"
                }`}
              >
                {t.admin.nfcModeWrite}
              </button>
              <button
                type="button"
                disabled={isWriting}
                onClick={() => { setMode("wipe"); setIsCompleted(false); }}
                className={`py-1 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mode === "wipe"
                    ? "bg-brand-white text-brand-accent shadow-xs"
                    : "text-brand-text-muted hover:text-brand-accent"
                }`}
              >
                {t.admin.nfcModeWipe}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.cancel}
              className="p-1 text-brand-text-muted hover:text-brand-navy-dark rounded-md hover:bg-brand-bg-alt transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Pantalla de Celebración al finalizar el lote */}
        {isCompleted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col items-center gap-3 text-center animate-fadeInUp my-auto">
            <span className="text-3xl">🎉</span>
            <h4 className="font-serif font-bold text-xl text-emerald-900 leading-tight">
              {t.admin.nfcBatchCompletedTitle}
            </h4>
            <p className="font-sans text-xs text-emerald-800 leading-relaxed max-w-sm">
              {t.admin.nfcBatchCompletedDesc}
            </p>
            <span className="font-mono text-sm font-bold text-emerald-950 bg-white/80 border border-emerald-200 px-3 py-1 rounded-lg">
              {strip.length} / {strip.length} Kits Listos
            </span>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 min-h-[44px] px-6 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {t.admin.finishButton}
            </button>
          </div>
        ) : !isSupported && isMobile ? (
          <NfcAndroidGuideCard
            adminQrUrl={adminQrUrl}
            isMobile={true}
            batchName={batchName}
            totalChips={strip.length}
            onClose={onClose}
          />
        ) : (
          /* Contenido Principal: Horizontal 2-column en PC (md:grid-cols-2) y Compacto en Móvil */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch flex-1">
            {/* Columna Izquierda: Tarjeta Android en PC (o Kit Preview grande en Tablet/PC compatible) */}
            <div className="flex flex-col gap-2.5">
              {!isSupported ? (
                <NfcAndroidGuideCard
                  adminQrUrl={adminQrUrl}
                  isMobile={false}
                  batchName={batchName}
                  totalChips={strip.length}
                />
              ) : (
                /* En móvil con NFC mostramos la tarjeta en modo compacto para evitar scroll */
                <NfcKitPreviewCard
                  code={activeDevice.code}
                  qrDataUrl={activeQrDataUrl}
                  currentIndex={currentIndex}
                  totalChips={strip.length}
                  compact={true}
                />
              )}
            </div>

            {/* Columna Derecha: Controles de Grabación / Limpieza */}
            <div className="flex flex-col gap-2.5">
              {/* Si estamos en PC sin Web NFC, mostramos la tarjeta del kit en la columna derecha */}
              {!isSupported && (
                <NfcKitPreviewCard
                  code={activeDevice.code}
                  qrDataUrl={activeQrDataUrl}
                  currentIndex={currentIndex}
                  totalChips={strip.length}
                  compact={false}
                />
              )}

              {/* Barra de progreso y folio activo */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="font-bold text-brand-navy-dark">
                    #{currentIndex + 1} de {strip.length} · {activeDevice.code}
                  </span>
                  <span className="font-semibold text-brand-accent">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-brand-bg-alt rounded-full h-1.5 border border-brand-border-subtle overflow-hidden">
                  <div
                    className="bg-brand-accent h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Instrucción ergonómica compacta para móvil */}
              {isSupported && (
                <div className="p-2 bg-brand-nav-active/60 border border-brand-nav-blue/20 rounded-lg text-[11px] font-sans text-brand-navy-dark flex items-center gap-1.5">
                  <span className="text-xs">💡</span>
                  <p className="leading-tight">{t.admin.mobileDeskPrompt}</p>
                </div>
              )}

              {/* Controles del modo activo */}
              {mode === "write" ? (
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-brand-border-subtle bg-brand-bg-alt hover:border-brand-border-strong transition-colors">
                  <input
                    type="checkbox"
                    checked={lockReadOnly}
                    onChange={(e) => setLockReadOnly(e.target.checked)}
                    disabled={isWriting}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-brand-border-field text-brand-accent focus:ring-brand-nav-blue"
                  />
                  <span className="font-sans text-[11px] text-brand-text-desc leading-snug">
                    {t.admin.lockReadOnlyLabel}
                  </span>
                </label>
              ) : (
                <div className="flex flex-col gap-1 p-2 bg-rose-50/50 border border-brand-accent/20 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🧹</span>
                    <h4 className="font-serif font-bold text-xs text-brand-navy-dark">
                      {t.admin.nfcModeWipe}
                    </h4>
                  </div>
                  <p className="font-sans text-[10px] text-brand-text-desc leading-snug">
                    {t.admin.nfcWipeInstructions}
                  </p>
                  {wipedCount > 0 && (
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit">
                      ✓ {wipedCount} {t.admin.chipsWipedCount}
                    </span>
                  )}
                </div>
              )}

              {/* Mensajes de Estado y Error */}
              {statusMessage && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-sans text-center font-medium shadow-xs">
                  {statusMessage}
                </div>
              )}

              {errorMessage && (
                <div className="p-2 bg-rose-50 border border-brand-accent/30 rounded-lg text-[11px] text-brand-accent font-sans text-center font-medium shadow-xs">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Botón Principal y Cancelar */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                <button
                  type="button"
                  disabled={!isSupported || isWriting}
                  onClick={handleStartSession}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-navy-dark text-white hover:bg-brand-navy-secondary text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWriting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      {t.admin.scanningNfc}
                    </span>
                  ) : (
                    <span>{mode === "write" ? t.admin.startNfcScanButton : t.admin.nfcWipeStartButton}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[36px] inline-flex items-center justify-center px-4 py-1.5 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
