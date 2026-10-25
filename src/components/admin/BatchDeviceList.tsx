/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Inventario de Chips del Lote
 * ARCHIVO: src/components/admin/BatchDeviceList.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la cuadrícula de chips SAFE-XXXX del lote seleccionado. Muestra el
 * estado real del chip (UNCLAIMED, ACTIVE o DISABLED), el PIN confidencial para
 * control de calidad, la marca de grabado NFC y el acceso al grabador móvil.
 * La plancha QR del lote se abre desde la cabecera de esta sección.
 *
 * ENTRADAS: devices reales de GET /api/admin/batches?batchName=…, lote activo,
 * estado de carga, callback de grabado NFC y callback de impresión QR.
 * SALIDAS: inventario responsivo con botones táctiles de 44px.
 * DEPENDENCIAS: useLocale, IncidentButton, AdminDeviceItem.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero simuladores ni estados fabricados: solo el grabador NFC real.
 * - Diseño Incident: borde 1px, botones neutros y cero gradientes.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentButton } from "@/components/ui/IncidentButton";
import type { AdminDeviceItem } from "@/lib/api-client";

export interface BatchDeviceListProps {
  /** Chips reales del lote seleccionado. */
  devices: AdminDeviceItem[];
  /** Nombre del lote abierto. */
  selectedBatchName: string;
  /** Indica que el detalle del lote está cargando. */
  isLoadingDevices: boolean;
  /** Abre el grabador NFC real para el chip elegido. */
  onSelectNfc: (device: AdminDeviceItem) => void;
  /** Abre la plancha QR del lote completo. */
  onPrintQr: () => void;
}

/**
 * Inventario del lote con acciones de producción: grabar antena NFC e
 * imprimir la plancha QR completa. Sin botón de simulación.
 */
export function BatchDeviceList({
  devices,
  selectedBatchName,
  isLoadingDevices,
  onSelectNfc,
  onPrintQr,
}: BatchDeviceListProps) {
  const { t } = useLocale();

  /** Rotula el estado real del chip según el enum de PostgreSQL. */
  const statusLabel = (status: string): string => {
    if (status === "ACTIVE") return t.common.statusActive;
    if (status === "DISABLED") return t.admin.statusDisabled;
    return t.common.statusUnclaimed;
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-serif font-bold text-heading-sm text-ink">
            {t.admin.batchInventoryTitle}
          </h2>
          <span className="font-sans tracking-widest text-micro font-bold text-signal-orange">
            {selectedBatchName || t.admin.batchNamePlaceholder}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLoadingDevices && (
            <span className="font-sans text-micro text-carbon">
              {t.admin.generatingBatch}
            </span>
          )}
          {devices.length > 0 && (
            <IncidentButton
              type="button"
              variant="paper"
              size="sm"
              onClick={onPrintQr}
            >
              🖨️ {t.admin.printQrsButton}
            </IncidentButton>
          )}
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="p-8 border border-dashed border-mist rounded-[8px] bg-paper text-center">
          <p className="font-sans text-micro text-carbon">
            {t.admin.batchInventoryEmpty}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {devices.map((device) => (
            <div
              key={device.code}
              className="p-4 bg-paper border border-ink rounded-[8px] flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans tracking-widest text-body font-bold text-ink">
                  {device.code}
                </span>
                <span
                  className={`font-sans text-[11px] font-bold px-2 py-0.5 rounded-[3px] border ${
                    device.status === "ACTIVE"
                      ? "bg-concrete border-ink text-ink"
                      : device.status === "DISABLED"
                        ? "bg-paper border-mist text-carbon"
                        : "bg-paper border-signal-orange text-signal-orange"
                  }`}
                >
                  {statusLabel(device.status)}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-micro font-sans text-carbon border-t border-mist pt-2">
                <span className="flex items-center justify-between gap-2">
                  <span>
                    {t.admin.pinLabel}:{" "}
                    <strong className="font-sans tracking-widest text-ink">
                      {device.activationPin || "••••••"}
                    </strong>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border ${
                      device.isNfcEncoded
                        ? "bg-parchment text-ink border-ember"
                        : "bg-paper text-carbon border-mist"
                    }`}
                  >
                    {device.isNfcEncoded
                      ? `✓ ${t.admin.riderNfcEncoded}`
                      : t.admin.riderNfcPending}
                  </span>
                </span>
              </div>

              <IncidentButton
                type="button"
                variant="neutral"
                size="sm"
                onClick={() => onSelectNfc(device)}
                className="w-full"
              >
                📱 {t.admin.nfcWriterButton}
              </IncidentButton>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
