/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Grabador NFC Móvil en Ráfaga
 * ARCHIVO: src/components/admin/NfcBurstWriterModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal táctil para codificación en serie de chips NFC de cascos con Web NFC API.
 * Permite al operario pasar teléfonos sobre stickers en serie, programando
 * la URL del gateway (/r/[code]?v=nfc), bloqueando opcionalmente el chip como
 * sólo lectura y avanzando al siguiente folio del lote con señal háptica.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Manejo exhaustivo de la Web NFC API con soporte de fallback si no está disponible.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { apiClient, type AdminDeviceItem } from "@/lib/api-client";

export interface NfcBurstWriterModalProps {
  device: AdminDeviceItem;
  onSuccess: (updatedDevice: AdminDeviceItem) => void;
  onClose: () => void;
}

export function NfcBurstWriterModal({
  device,
  onSuccess,
  onClose,
}: NfcBurstWriterModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [isSupported, setIsSupported] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [lockReadOnly, setLockReadOnly] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setIsSupported(true);
    }
  }, []);

  const handleStartWrite = async () => {
    setErrorMessage("");
    setStatusMessage(t.admin.scanningNfc);
    setIsWriting(true);
    triggerHaptic("light");

    try {
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      const targetUrl = `https://safe.app/r/${device.code}?v=nfc`;

      // Escritura del registro NDEF oficial de tipo URL
      await ndef.write({
        records: [
          {
            recordType: "url",
            data: targetUrl,
          },
        ],
      });

      // Opcional: bloqueo permanente contra sobreescritura si está marcado
      if (lockReadOnly && typeof ndef.makeReadOnly === "function") {
        await ndef.makeReadOnly();
      }

      // Registro en el servidor
      await apiClient.recordNfcWrite({
        code: device.code,
        nfcSerialNumber: `NFC_${Date.now()}`,
        isLockedReadOnly: lockReadOnly,
      });

      triggerHaptic("success");
      setStatusMessage(t.admin.nfcSuccess);

      setTimeout(() => {
        onSuccess({
          ...device,
          status: "ACTIVE",
          encodedAt: new Date().toISOString(),
        });
      }, 1000);
    } catch (err: any) {
      triggerHaptic("error");
      setIsWriting(false);
      setErrorMessage(err?.message || t.admin.nfcError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full sm:max-w-md bg-paper border border-ink rounded-t-[16px] sm:rounded-[12px] p-6 shadow-2xl flex flex-col gap-4">
        {/* Tirador visual táctil para móvil */}
        <div className="w-10 h-1 bg-mist rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between border-b border-ink pb-3">
          <div>
            <h3 className="font-serif font-bold text-heading-sm text-ink leading-tight">
              {t.admin.nfcWriterTitle}
            </h3>
            <span className="font-mono text-micro font-bold text-signal-orange">
              {device.code}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-carbon hover:text-ink text-body font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="font-sans text-micro text-carbon leading-relaxed">
          {t.admin.nfcWriterSubtitle}
        </p>

        {/* Verificación de compatibilidad con Web NFC */}
        {!isSupported && (
          <div className="p-3 bg-red-50 border border-alert-red rounded-[6px] text-micro text-alert-red font-sans">
            ⚠️ {t.admin.nfcNotSupported}
          </div>
        )}

        {/* Opción de bloqueo de chip contra manipulación */}
        <label className="flex items-start gap-3 cursor-pointer select-none border border-mist p-3 rounded-[6px] bg-concrete">
          <input
            type="checkbox"
            checked={lockReadOnly}
            onChange={(e) => setLockReadOnly(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-ink text-signal-orange focus:ring-0"
          />
          <span className="font-sans text-[12px] text-ink leading-tight">
            {t.admin.lockReadOnlyLabel}
          </span>
        </label>

        {/* Mensajes de estado */}
        {statusMessage && (
          <div className="p-3 bg-concrete border border-ink rounded-[6px] text-micro text-ink font-sans text-center font-bold">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-alert-red rounded-[6px] text-micro text-alert-red font-sans text-center">
            {errorMessage}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-2 pt-2">
          <IncidentButton
            type="button"
            variant="emergency"
            size="lg"
            disabled={!isSupported || isWriting}
            isLoading={isWriting}
            onClick={handleStartWrite}
            className="w-full"
          >
            {isWriting ? t.admin.scanningNfc : t.admin.startNfcScanButton}
          </IncidentButton>

          <IncidentButton
            type="button"
            variant="neutral"
            onClick={onClose}
            className="w-full"
          >
            {t.common.cancel}
          </IncidentButton>
        </div>
      </div>
    </div>
  );
}
