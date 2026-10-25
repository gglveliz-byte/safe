/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Simulador de Antena NFC para PC
 * ARCHIVO: src/components/admin/NfcSimulatorModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal de simulación para computadoras y laptops sin hardware de antena NFC.
 * Valida el ciclo completo de codificación contra el ledger real: genera un
 * UID hexadecimal válido (7 bytes con separadores ":", formato idéntico al de
 * un NTAG216 real), confirma vía PATCH /api/admin/encode-nfc y reporta el
 * dispositivo REAL devuelto por el backend sin fabricar estados (el kit sigue
 * UNCLAIMED hasta su activación con PIN). Si el endpoint FALLA, muestra el
 * error del diccionario con háptica de error y NUNCA invoca onSuccess.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - Hoja inferior (bottom sheet) en móvil, paleta Incident estricta y
 *   objetivos táctiles ≥44px.
 * - Textos 100% del diccionario bilingüe; cero dominios inventados.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { apiClient, type AdminDeviceItem } from "@/lib/api-client";
import {
  buildHelmetGatewayClientUrl,
  buildUpdatedDevice,
  describeNfcError,
  generateSimulatedNfcUid,
  type EncodeNfcResult,
} from "@/lib/nfc-write-utils";

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
  const [errorMessage, setErrorMessage] = useState("");
  const [lockReadOnly, setLockReadOnly] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState("");

  // URL canónica del gateway resuelta en el navegador (NEXT_PUBLIC_APP_URL
  // horneada en el bundle u origen actual; jamás un dominio hardcodeado)
  useEffect(() => {
    setGatewayUrl(buildHelmetGatewayClientUrl(device.code, "nfc"));
  }, [device.code]);

  const handleSimulate = async () => {
    setErrorMessage("");
    setSuccessNotice(false);
    setIsSimulating(true);
    triggerHaptic("light");

    try {
      // Simula la latencia de contacto electromagnético de una antena real
      await new Promise((resolve) => setTimeout(resolve, 400));

      // UID simulado con formato VÁLIDO: 7 bytes hexadecimales aleatorios
      // separados por ":" (crypto.getRandomValues), idéntico a un NTAG216
      // real. Cumple la validación estricta /^[A-Fa-f0-9:-]+$/ del backend.
      const simulatedUid = generateSimulatedNfcUid();

      const result = (await apiClient.recordNfcWrite({
        code: device.code,
        nfcSerialNumber: simulatedUid,
        isLockedReadOnly: lockReadOnly,
      })) as EncodeNfcResult;

      triggerHaptic("success");
      setSuccessNotice(true);

      // Dispositivo REAL del ledger: nunca se fabrica status "ACTIVE"
      const updated = buildUpdatedDevice(device, result.device ?? {}, simulatedUid);
      setTimeout(() => onSuccess(updated), 700);
    } catch (err: unknown) {
      // Fallo REAL del endpoint: aviso del diccionario + háptica de error.
      // NUNCA se invoca onSuccess: el ledger no registró ninguna grabación.
      triggerHaptic("error");
      setErrorMessage(describeNfcError(err, t.admin.nfcError));
      console.error("[Simulador NFC] Falló la confirmación en el ledger:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full sm:max-w-md bg-paper border border-ink rounded-t-[16px] sm:rounded-[12px] p-6 shadow-incident flex flex-col gap-4">
        {/* Tirador visual táctil para móvil (hoja inferior) */}
        <div className="w-10 h-1 bg-mist rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between border-b border-ink pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              📡
            </span>
            <h3 className="font-serif font-bold text-heading-sm text-ink leading-tight">
              {t.admin.simulatorTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.cancel}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-carbon hover:text-ink text-body font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="font-sans text-micro text-carbon leading-relaxed">
          {t.admin.simulatorSubtitle}
        </p>

        {/* Datos del chip a codificar */}
        <div className="p-3 bg-concrete border border-ink rounded-[6px] flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-sans text-[11px] uppercase font-bold text-carbon">
              {t.dashboard.folioLabel}
            </span>
            <span className="font-sans tracking-widest text-micro font-bold text-ink">
              {device.code}
            </span>
          </div>
          {/* Previsualización del enlace del gateway (dato puro, sin etiqueta
              de jerga técnica) */}
          {gatewayUrl && (
            <span className="font-sans tracking-wide text-[11px] text-carbon truncate block">
              {gatewayUrl}
            </span>
          )}
        </div>

        {/* Opción de bloqueo permanente del chip contra manipulación */}
        <label className="flex items-start gap-3 cursor-pointer select-none border border-mist p-3 rounded-[6px] bg-concrete">
          <input
            type="checkbox"
            checked={lockReadOnly}
            onChange={(e) => setLockReadOnly(e.target.checked)}
            disabled={isSimulating}
            className="mt-1 h-4 w-4 rounded border-ink text-signal-orange focus:ring-0"
          />
          <span className="font-sans text-[12px] text-ink leading-tight">
            {t.admin.lockReadOnlyLabel}
          </span>
        </label>

        {/* Confirmación real del ledger (paleta Incident: pergamino + brasa) */}
        {successNotice && (
          <div className="p-3 bg-parchment border border-ember rounded-[6px] text-micro text-ink font-sans text-center font-bold">
            ✓ {t.admin.nfcSuccess}
          </div>
        )}

        {/* Error real del endpoint: nunca se fabrica éxito */}
        {errorMessage && (
          <div className="p-3 bg-[rgba(255,73,44,0.08)] border border-alert-red rounded-[6px] text-micro text-alert-red font-sans text-center">
            ⚠️ {errorMessage}
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
