/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Componentes de Administración — Listado de Kits de Hardware y Estado NFC
 * ARCHIVO: src/components/admin/BatchDeviceList.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la cuadrícula de dispositivos SAFE-XXXX de un lote de manufactura.
 * Muestra el estado del chip (UNCLAIMED o ACTIVE), el PIN secreto para control
 * de calidad y los botones de acción para grabado NFC físico o simulación en PC.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Estética Incident (1px border negro, botones neutros y paper, sin gradientes).
 * - Cero datos hardcodeados.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentButton } from "@/components/ui/IncidentButton";
import type { AdminDeviceItem } from "@/lib/api-client";

export interface BatchDeviceListProps {
  devices: AdminDeviceItem[];
  selectedBatchName: string;
  isLoadingDevices: boolean;
  onSelectNfc: (device: AdminDeviceItem) => void;
  onSelectSimulator: (device: AdminDeviceItem) => void;
}

export function BatchDeviceList({
  devices,
  selectedBatchName,
  isLoadingDevices,
  onSelectNfc,
  onSelectSimulator,
}: BatchDeviceListProps) {
  const { t } = useLocale();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-bold text-heading-sm text-ink">
          {t.admin.generatedBatchesTitle}:{" "}
          <span className="font-sans tracking-widest text-signal-orange">
            {selectedBatchName || t.admin.batchNamePlaceholder}
          </span>
        </h3>
        {isLoadingDevices && (
          <span className="font-sans text-micro text-carbon">
            {t.admin.generatingBatch}
          </span>
        )}
      </div>

      {devices.length === 0 ? (
        <div className="p-8 border border-dashed border-mist rounded-[8px] bg-paper text-center">
          <p className="font-sans text-micro text-carbon">
            {t.admin.batchSubtitle}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {devices.map((device) => (
            <div
              key={device.code}
              className="p-4 bg-paper border border-ink rounded-[8px] flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-sans tracking-widest text-body font-bold text-ink">
                  {device.code}
                </span>
                <span
                  className={`font-sans text-[11px] font-bold px-2 py-0.5 rounded-[3px] ${
                    device.status === "ACTIVE"
                      ? "bg-concrete border border-ink text-ink"
                      : "bg-paper border border-signal-orange text-signal-orange"
                  }`}
                >
                  {device.status === "ACTIVE"
                    ? t.common.statusActive
                    : t.common.statusUnclaimed}
                </span>
              </div>

              <div className="flex items-center justify-between text-micro font-sans text-carbon border-t border-mist pt-2">
                <span>
                  PIN:{" "}
                  <strong className="font-sans tracking-widest text-ink">
                    {device.activationPin || "••••••"}
                  </strong>
                </span>
                {device.isNfcEncoded && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-[3px] bg-parchment text-ink border border-ember">
                    ✓ {t.admin.nfcSuccess}
                  </span>
                )}
              </div>

              {/* Botones de Codificación NFC y Simulación */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <IncidentButton
                  type="button"
                  variant="neutral"
                  size="sm"
                  onClick={() => onSelectNfc(device)}
                >
                  📱 {t.admin.nfcWriterTitle}
                </IncidentButton>

                <IncidentButton
                  type="button"
                  variant="paper"
                  size="sm"
                  onClick={() => onSelectSimulator(device)}
                >
                  💻 {t.admin.simulatorTitle}
                </IncidentButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
