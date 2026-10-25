/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Inventario de Chips del Lote (SAFE 2026)
 * ARCHIVO: src/components/admin/BatchDeviceList.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Renderiza la cuadrícula de chips SAFE-XXXX del lote seleccionado bajo el
 * sistema de diseño SAFE 2026. Muestra el estado real del chip, el PIN
 * confidencial para control de calidad, el estado de grabado NFC y las acciones:
 * 1. Grabado NFC real (Web NFC API).
 * 2. Impresión de plancha QR del lote.
 * 3. Eliminación del chip (libera al usuario asociado).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero simuladores ni estados inventados.
 * - 100% bilingüe y táctil >= 44px.
 * ==============================================================================
 */

"use client";

import React, { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import type { AdminDeviceItem } from "@/lib/api-client";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";

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
  /** Callback cuando se elimina un chip (opcional: para UI sync). */
  onDeviceDeleted?: (code: string) => void;
}

/**
 * Inventario de chips del lote seleccionado con estética SAFE 2026.
 */
export function BatchDeviceList({
  devices,
  selectedBatchName,
  isLoadingDevices,
  onSelectNfc,
  onPrintQr,
  onDeviceDeleted,
}: BatchDeviceListProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Estado del modal de confirmación de eliminación
  const [deleteTarget, setDeleteTarget] = useState<AdminDeviceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  /** Rotula el estado real del chip según el enum de PostgreSQL. */
  const statusLabel = (status: string): string => {
    if (status === "ACTIVE") return t.common.statusActive;
    if (status === "DISABLED") return t.admin.statusDisabled;
    return t.common.statusUnclaimed;
  };

  /** Abre el modal de confirmación para eliminar un chip. */
  const handleDeleteDevice = (device: AdminDeviceItem) => {
    triggerHaptic("light");
    setDeleteTarget(device);
    setDeleteError("");
  };

  /** Ejecuta la eliminación confirmada. */
  const handleConfirmDelete = async (): Promise<boolean> => {
    if (!deleteTarget) return false;
    setIsDeleting(true);
    setDeleteError("");

    try {
      const result = await apiClient.deleteAdminDevice(deleteTarget.code);
      if (!result.success) throw new Error(result.message || t.admin.deleteError);
      triggerHaptic("success");
      onDeviceDeleted?.(deleteTarget.code);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.admin.deleteError;
      setDeleteError(msg);
      triggerHaptic("error");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="bg-brand-white border border-brand-border-subtle rounded-xl p-6 sm:p-7 shadow-sm hover:border-brand-border-strong flex flex-col gap-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight">
            {t.admin.batchInventoryTitle}
          </h2>
          <span className="font-mono text-xs font-bold text-brand-accent uppercase tracking-wider mt-0.5 block">
            {selectedBatchName || t.admin.batchNamePlaceholder}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLoadingDevices && (
            <span className="font-sans text-xs text-brand-text-muted">
              {t.admin.generatingBatch}
            </span>
          )}
          {devices.length > 0 && (
            <button
              type="button"
              onClick={onPrintQr}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
            >
              <span>🖨️</span>
              {t.admin.printQrsButton}
            </button>
          )}
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="p-8 border border-dashed border-brand-border-subtle rounded-xl bg-brand-bg-alt text-center">
          <p className="font-sans text-xs text-brand-text-muted">
            {t.admin.batchInventoryEmpty}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.code}
              className="p-5 bg-brand-white border border-brand-border-subtle rounded-xl flex flex-col justify-between gap-4 shadow-sm hover:border-brand-border-strong transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-bold text-brand-navy-dark tracking-wide">
                  {device.code}
                </span>
                <span
                  className={`font-sans text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                    device.status === "ACTIVE"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : device.status === "DISABLED"
                        ? "bg-slate-100 border-slate-200 text-slate-600"
                        : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  {statusLabel(device.status)}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-sans text-brand-text-desc border-t border-brand-separator pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {t.admin.pinLabel}:{" "}
                    <strong className="font-mono text-xs font-bold text-brand-navy-dark tracking-wider">
                      {device.activationPin || "••••••"}
                    </strong>
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      device.isNfcEncoded
                        ? "bg-brand-nav-active text-brand-navy-dark border-brand-nav-blue/30"
                        : "bg-brand-bg-alt text-brand-text-muted border-brand-border-subtle"
                    }`}
                  >
                    {device.isNfcEncoded
                      ? `✓ ${t.admin.riderNfcEncoded}`
                      : t.admin.riderNfcPending}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectNfc(device)}
                  className="min-h-[40px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
                >
                  <span>📱</span>
                  {t.admin.nfcWriterButton}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteDevice(device)}
                  className="min-h-[36px] w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-50 border border-brand-accent/20 hover:bg-brand-accent hover:text-white text-brand-accent text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <span>🗑️</span>
                  {t.admin.deleteChipButton}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación de eliminación de chip */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={t.admin.deleteChipTitle}
          message={t.admin.deleteChipMessage}
          details={{
            [t.admin.columnChip]: deleteTarget.code,
            [t.admin.columnStatus]: statusLabel(deleteTarget.status),
            [t.admin.nfcWriterTitle]: deleteTarget.isNfcEncoded
              ? t.admin.riderNfcEncoded
              : t.admin.riderNfcPending,
          }}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError("");
          }}
          isLoading={isDeleting}
          errorMessage={deleteError}
        />
      )}
    </section>
  );
}
