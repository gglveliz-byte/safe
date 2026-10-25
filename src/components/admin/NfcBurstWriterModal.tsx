/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Grabador NFC Móvil en Ráfaga
 * ARCHIVO: src/components/admin/NfcBurstWriterModal.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Modal táctil para la codificación en tira secuencial de chips NFC de cascos
 * con la Web NFC API real (patrón §7.3 del documento maestro):
 * 1. `await ndef.scan()` abre una sesión de escucha real de la antena.
 * 2. `ndef.onreading` lee el UID físico del chip (event.serialNumber).
 * 3. Candado anti-doble-toque: se ignora un UID idéntico al anterior.
 * 4. Escribe el registro NDEF de tipo URL con el dominio canónico del gateway
 *    (NEXT_PUBLIC_APP_URL u origen actual; NUNCA un dominio hardcodeado).
 * 5. Bloquea el chip como sólo lectura de forma permanente si el switch está activo.
 * 6. Confirma el UID real vía PATCH /api/admin/encode-nfc, vibra, reporta el
 *    progreso y avanza de forma automática al siguiente folio del lote.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 450 líneas físicas.
 * - UID real del chip (hex) como número de serie; nunca se fabrica status
 *   "ACTIVE" (el kit sigue UNCLAIMED hasta su activación con PIN).
 * - Paleta Incident estricta, objetivos táctiles ≥44px, textos 100% diccionario.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { apiClient, type AdminDeviceItem } from "@/lib/api-client";
import {
  buildHelmetGatewayClientUrl,
  buildUpdatedDevice,
  describeNfcError,
  type EncodeNfcResult,
} from "@/lib/nfc-write-utils";

/** Tipado mínimo de la Web NFC API (aún ausente de la lib estándar del DOM) */
interface NdefReadingEventLike {
  serialNumber: string;
}

interface NdefReaderLike {
  scan: () => Promise<void>;
  write: (message: {
    records: Array<{ recordType: string; data: string }>;
  }) => Promise<void>;
  makeReadOnly?: () => Promise<void>;
  onreading: ((event: NdefReadingEventLike) => void) | null;
  onreadingerror?: ((error: unknown) => void) | null;
}

export interface NfcBurstWriterModalProps {
  /** Folio que detonó la apertura del modal (punto de partida de la tira) */
  device: AdminDeviceItem;
  /** Opcional: tira completa del lote para la ráfaga con avance automático */
  devices?: AdminDeviceItem[];
  /** Opcional: avisa de cada chip grabado individualmente sin cerrar el modal */
  onProgress?: (
    index: number,
    total: number,
    updatedDevice: AdminDeviceItem,
  ) => void;
  /** Avisa del último dispositivo real grabado al concluir la tira */
  onSuccess: (updatedDevice: AdminDeviceItem) => void;
  onClose: () => void;
}

export function NfcBurstWriterModal({
  device,
  devices,
  onProgress,
  onSuccess,
  onClose,
}: NfcBurstWriterModalProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Tira secuencial: lote completo si el padre lo provee; si no, chip único
  const strip = useMemo(
    () => (devices && devices.length > 0 ? devices : [device]),
    [devices, device],
  );
  const initialIndex = useMemo(() => {
    const found = strip.findIndex((item) => item.code === device.code);
    return found >= 0 ? found : 0;
  }, [strip, device.code]);

  const [isSupported, setIsSupported] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [lockReadOnly, setLockReadOnly] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Referencias consumidas dentro del cierre onreading (la sesión sigue abierta)
  const stripRef = useRef(strip);
  const indexRef = useRef(initialIndex);
  const lockRef = useRef(lockReadOnly);
  const lastPhysicalUidRef = useRef("");
  const isProcessingRef = useRef(false);
  const cancelledRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  const onSuccessRef = useRef(onSuccess);

  // Sincronización de referencias con el último render (props y switches vivos)
  useEffect(() => {
    stripRef.current = strip;
    lockRef.current = lockReadOnly;
    onProgressRef.current = onProgress;
    onSuccessRef.current = onSuccess;
  });

  // Reposiciona el índice de la tira si cambia el folio de arranque
  useEffect(() => {
    indexRef.current = initialIndex;
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Verificación de compatibilidad con Web NFC y protección ante desmontaje
  useEffect(() => {
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setIsSupported(true);
    }
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  // Procesamiento completo de UN chip físico detectado por la antena (§7.3)
  const handleChipReading = useCallback(
    async (ndef: NdefReaderLike, serialNumber: string) => {
      if (cancelledRef.current || isProcessingRef.current) return;

      const uid = (serialNumber || "").trim();
      // Candado anti-doble-toque: se ignora el mismo chip ya procesado
      if (!uid || uid === lastPhysicalUidRef.current) return;

      isProcessingRef.current = true;
      const index = indexRef.current;
      const target = stripRef.current[index];
      if (!target) {
        isProcessingRef.current = false;
        return;
      }

      setErrorMessage("");
      setStatusMessage("");

      try {
        // 1) Registro NDEF oficial de tipo URL con el dominio canónico del
        //    gateway (NEXT_PUBLIC_APP_URL u origen actual; cero dominios fijos)
        await ndef.write({
          records: [
            {
              recordType: "url",
              data: buildHelmetGatewayClientUrl(target.code, "nfc"),
            },
          ],
        });

        // 2) Bloqueo permanente opcional contra sobreescritura maliciosa
        if (lockRef.current && typeof ndef.makeReadOnly === "function") {
          await ndef.makeReadOnly();
        }

        // 3) Confirmación en el ledger con el UID real del chip (hex válido
        //    para la regex estricta del backend, jamás un serial fabricado)
        const result = (await apiClient.recordNfcWrite({
          code: target.code,
          nfcSerialNumber: uid,
          isLockedReadOnly: lockRef.current,
        })) as EncodeNfcResult;

        // 4) Se registra el UID físico y se fusiona el dispositivo REAL del
        //    backend sin fabricar status (sigue UNCLAIMED hasta activar con PIN)
        lastPhysicalUidRef.current = uid;
        const updated = buildUpdatedDevice(target, result.device ?? {}, uid);

        // 5) Háptica de éxito y reporte de progreso del folio actual
        triggerHaptic("success");
        setStatusMessage(t.admin.nfcSuccess);
        onProgressRef.current?.(index, stripRef.current.length, updated);

        const total = stripRef.current.length;
        if (index + 1 >= total) {
          // Tira concluida: se reporta el último dispositivo real al padre
          window.setTimeout(() => {
            if (!cancelledRef.current) onSuccessRef.current(updated);
          }, 900);
        } else {
          // Avance automático al siguiente folio; la sesión de escucha
          // permanece abierta esperando el próximo chip del operario
          indexRef.current = index + 1;
          setCurrentIndex(index + 1);
          window.setTimeout(() => {
            if (!cancelledRef.current) setStatusMessage(t.admin.scanningNfc);
          }, 900);
        }
      } catch (err: unknown) {
        // El DOMException técnico en inglés se mapea a texto del diccionario
        triggerHaptic("error");
        setErrorMessage(describeNfcError(err, t.admin.nfcError));
        console.error("[NFC] Error al grabar el chip del casco:", err);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [t, triggerHaptic],
  );

  // Apertura de la sesión real de escucha de la antena (Web NFC API)
  const handleStartWrite = useCallback(async () => {
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

      // Apertura real de la antena: cada chip acercado dispara onreading
      await ndef.scan();

      ndef.onreading = (event: NdefReadingEventLike) => {
        void handleChipReading(ndef, event.serialNumber);
      };
      ndef.onreadingerror = () => {
        if (cancelledRef.current || isProcessingRef.current) return;
        triggerHaptic("error");
        setErrorMessage(t.admin.nfcError);
      };
    } catch (err: unknown) {
      triggerHaptic("error");
      setIsWriting(false);
      setErrorMessage(describeNfcError(err, t.admin.nfcError));
      console.error("[NFC] No se pudo iniciar el escaneo de la antena:", err);
    }
  }, [t, triggerHaptic, handleChipReading]);

  // Folio objetivo de la tira que el operario debe acercar en este momento
  const activeDevice = strip[Math.min(currentIndex, strip.length - 1)] ?? device;

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full sm:max-w-md bg-paper border border-ink rounded-t-[16px] sm:rounded-[12px] p-6 shadow-incident flex flex-col gap-4">
        {/* Tirador visual táctil para móvil */}
        <div className="w-10 h-1 bg-mist rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between border-b border-ink pb-3">
          <div>
            <h3 className="font-serif font-bold text-heading-sm text-ink leading-tight">
              {t.admin.nfcWriterTitle}
            </h3>
            <span className="font-sans tracking-widest text-micro font-bold text-signal-orange">
              {activeDevice.code}
            </span>
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
          {t.admin.nfcWriterSubtitle}
        </p>

        {/* Verificación de compatibilidad con Web NFC */}
        {!isSupported && (
          <div className="p-3 bg-[rgba(255,73,44,0.08)] border border-alert-red rounded-[6px] text-micro text-alert-red font-sans">
            ⚠️ {t.admin.nfcNotSupported}
          </div>
        )}

        {/* Opción de bloqueo permanente del chip contra manipulación */}
        <label className="flex items-start gap-3 cursor-pointer select-none border border-mist p-3 rounded-[6px] bg-concrete">
          <input
            type="checkbox"
            checked={lockReadOnly}
            onChange={(e) => setLockReadOnly(e.target.checked)}
            disabled={isWriting}
            className="mt-1 h-4 w-4 rounded border-ink text-signal-orange focus:ring-0"
          />
          <span className="font-sans text-[12px] text-ink leading-tight">
            {t.admin.lockReadOnlyLabel}
          </span>
        </label>

        {/* Progreso de la tira secuencial: posición y folio objetivo (datos puros) */}
        {isWriting && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-paper border border-mist rounded-[6px]">
            <span className="font-sans tracking-widest text-micro font-bold text-ink">
              #{currentIndex + 1} / {strip.length}
            </span>
            <span className="font-sans tracking-widest text-micro font-bold text-signal-orange">
              {activeDevice.code}
            </span>
          </div>
        )}

        {/* Mensajes de estado */}
        {statusMessage && (
          <div className="p-3 bg-concrete border border-ink rounded-[6px] text-micro text-ink font-sans text-center font-bold">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-[rgba(255,73,44,0.08)] border border-alert-red rounded-[6px] text-micro text-alert-red font-sans text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Botones de acción (objetivo táctil mínimo ≥44px garantizado) */}
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
