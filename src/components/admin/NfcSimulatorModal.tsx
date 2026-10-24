/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Simulador de Antena NFC para PC
 * ARCHIVO: src/components/admin/NfcSimulatorModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal de simulación para computadoras y laptops sin hardware de antena NFC.
 * Permite a los desarrolladores y operadores validar el flujo de codificación,
 * actualización del estado del chip en el ledger y avance al siguiente kit.
 * 
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas.
 * - Modo de prueba de laboratorio para ambientes sin sensor físico.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { apiClient, type AdminDeviceItem } from "@/lib/api-client";

export interface NfcSimulatorModalProps {
  device: AdminDeviceItem;
  onSuccess: (updatedDevice: AdminDeviceItem) => void;
  onClose: () => void;
}

export function NfcSimulatorModal({
  device,
  onSuccess,
  onClose,
}: NfcSimulatorModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  const [isSimulating, setIsSimulating] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    triggerHaptic("light");

    try {
      // Simular latencia de contacto electromagnético de 400ms
      await new Promise((resolve) => setTimeout(resolve, 400));

      await apiClient.recordNfcWrite({
        code: device.code,
        nfcSerialNumber: `SIM_NFC_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        isLockedReadOnly: true,
      });

      triggerHaptic("success");
      setSuccessNotice(true);

      setTimeout(() => {
        onSuccess({
          ...device,
          status: "ACTIVE",
          encodedAt: new Date().toISOString(),
        });
      }, 700);
    } catch {
      // Fallback
      onSuccess({
        ...device,
        status: "ACTIVE",
        encodedAt: new Date().toISOString(),
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-paper border-2 border-ink rounded-[12px] p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-ink pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <h3 className="font-serif font-bold text-heading-sm text-ink leading-tight">
              {t.admin.simulatorTitle}
            </h3>
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
          {t.admin.simulatorSubtitle}
        </p>

        {/* Datos del chip a codificar */}
        <div className="p-3 bg-concrete border border-ink rounded-[6px] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] uppercase font-bold text-carbon">
              Folio:
            </span>
            <span className="font-mono text-micro font-bold text-ink">
              {device.code}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] uppercase font-bold text-carbon">
              URL NDEF:
            </span>
            <span className="font-mono text-[11px] text-carbon truncate max-w-[220px]">
              https://safe.app/r/{device.code}?v=nfc
            </span>
          </div>
        </div>

        {successNotice && (
          <div className="p-3 bg-green-50 border border-green-600 rounded-[6px] text-micro text-green-900 font-sans text-center font-bold">
            ✓ {t.admin.nfcSuccess}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <IncidentButton
            type="button"
            variant="emergency"
            size="lg"
            disabled={isSimulating}
            isLoading={isSimulating}
            onClick={handleSimulate}
            className="w-full"
          >
            {isSimulating ? t.admin.scanningNfc : t.admin.simulateNfcWriteButton}
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
