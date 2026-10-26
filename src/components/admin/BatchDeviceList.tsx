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
  /** Callback cuando se elimina el lote completo de forma atómica. */
  onBatchDeleted?: (batchName: string) => void;
  /** Inicia la grabación continua en ráfaga para todo el lote. */
  onStartBurstWriting?: (devices: AdminDeviceItem[]) => void;
  /** Abre el modal directamente en modo limpieza a fábrica para un chip. */
  onSelectWipeNfc?: (device: AdminDeviceItem) => void;
}

const PAGE_SIZE = 20;

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
  onBatchDeleted,
  onStartBurstWriting,
  onSelectWipeNfc,
}: BatchDeviceListProps) {
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Paginación de 20 chips por página
  const [page, setPage] = useState(1);

  // Reiniciar página al cambiar de lote
  React.useEffect(() => {
    setPage(1);
  }, [selectedBatchName]);

  // Estado del modal de confirmación de eliminación de chip individual
  const [deleteTarget, setDeleteTarget] = useState<AdminDeviceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Estado del modal de confirmación de eliminación de lote completo
  const [isConfirmingBatchDelete, setIsConfirmingBatchDelete] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [batchDeleteError, setBatchDeleteError] = useState("");

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

  /** Ejecuta la eliminación confirmada de un chip individual. */
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

  /** Ejecuta la eliminación confirmada de todo el lote de forma atómica. */
  const handleConfirmBatchDelete = async (): Promise<boolean> => {
    if (!selectedBatchName) return false;
    setIsDeletingBatch(true);
    setBatchDeleteError("");

    try {
      const result = await apiClient.deleteAdminBatch(selectedBatchName);
      if (!result.success) throw new Error(result.message || t.admin.deleteError);
      triggerHaptic("success");
      onBatchDeleted?.(selectedBatchName);
      setIsConfirmingBatchDelete(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.admin.deleteError;
      setBatchDeleteError(msg);
      triggerHaptic("error");
      return false;
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Cálculo de paginación de 20 chips por página
  const totalPages = Math.max(1, Math.ceil(devices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedDevices = devices.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <section className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-6 shadow-xs hover:border-brand-border-strong flex flex-col gap-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight">
            {t.admin.batchInventoryTitle}{" "}
            <span className="font-sans text-xs font-normal text-brand-text-muted">
              ({devices.length} {t.admin.totalKitsLabel.toLowerCase()})
            </span>
          </h2>
          <span className="font-mono text-xs font-bold text-brand-accent uppercase tracking-wider mt-0.5 block">
            {selectedBatchName || t.admin.batchNamePlaceholder}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {isLoadingDevices && (
            <span className="font-sans text-xs text-brand-text-muted">
              {t.admin.generatingBatch}
            </span>
          )}
          {devices.length > 0 && onStartBurstWriting && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                onStartBurstWriting(devices);
              }}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-accent hover:bg-[#e03f27] text-white text-xs font-semibold rounded-lg shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand-accent cursor-pointer"
            >
              <span>⚡</span>
              <span>{t.admin.burstWriteBatchButton}</span>
            </button>
          )}

          {devices.length > 0 && (
            <button
              type="button"
              onClick={onPrintQr}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-semibold rounded-lg shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
            >
              <span>🖨️</span>
              <span>{t.admin.printQrsButton}</span>
            </button>
          )}

          {selectedBatchName && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setIsConfirmingBatchDelete(true);
                setBatchDeleteError("");
              }}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 border border-brand-accent/30 hover:bg-brand-accent hover:text-white text-brand-accent text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <span>🗑️</span>
              <span>{t.admin.deleteBatchButton}</span>
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
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
            {paginatedDevices.map((device) => (
              <div
                key={device.code}
                className="p-3 sm:p-3.5 bg-brand-white border border-brand-border-subtle rounded-xl flex flex-col justify-between gap-2.5 shadow-xs hover:border-brand-border-strong transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-brand-navy-dark tracking-wide">
                    {device.code}
                  </span>
                  <span
                    className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
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

                <div className="flex flex-col gap-1 text-xs font-sans text-brand-text-desc border-t border-brand-separator pt-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px]">
                      {t.admin.pinLabel}:{" "}
                      <strong className="font-mono text-xs font-bold text-brand-navy-dark tracking-wider">
                        {device.activationPin || "••••••"}
                      </strong>
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
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

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectNfc(device)}
                    className="min-h-[36px] flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
                  >
                    <span>📱</span>
                    <span>{t.admin.nfcWriterButton}</span>
                  </button>

                  {onSelectWipeNfc && (
                    <button
                      type="button"
                      onClick={() => onSelectWipeNfc(device)}
                      className="min-h-[36px] px-2.5 py-1.5 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-text-desc hover:text-brand-navy-dark text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      title={t.admin.nfcModeWipe}
                      aria-label={t.admin.nfcModeWipe}
                    >
                      <span>🧹</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteDevice(device)}
                    className="min-h-[36px] px-2.5 py-1.5 bg-rose-50 border border-brand-accent/20 hover:bg-brand-accent hover:text-white text-brand-accent text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    title={t.admin.deleteChipButton}
                    aria-label={t.admin.deleteChipButton}
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Barra de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-brand-bg-alt border border-brand-border-subtle rounded-xl text-xs font-sans mt-2">
              <span className="text-brand-text-muted">
                {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, devices.length)} de {devices.length} {t.admin.totalKitsLabel.toLowerCase()}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    triggerHaptic("light");
                  }}
                  className="px-3 py-1.5 border border-brand-border-field rounded-md bg-brand-white text-brand-navy-dark disabled:opacity-40 hover:bg-brand-bg-alt transition-colors cursor-pointer"
                >
                  ← {t.admin.paginationPrev}
                </button>

                <span className="px-2 font-semibold text-brand-navy-dark">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    triggerHaptic("light");
                  }}
                  className="px-3 py-1.5 border border-brand-border-field rounded-md bg-brand-white text-brand-navy-dark disabled:opacity-40 hover:bg-brand-bg-alt transition-colors cursor-pointer"
                >
                  {t.admin.paginationNext} →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación de chip individual */}
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

      {/* Modal de confirmación de eliminación de lote completo */}
      {isConfirmingBatchDelete && (
        <ConfirmDeleteModal
          title={t.admin.deleteBatchTitle}
          message={t.admin.deleteBatchMessage}
          details={{
            [t.admin.generatedBatchesTitle]: selectedBatchName,
            [t.admin.totalKitsLabel]: String(devices.length),
          }}
          onConfirm={handleConfirmBatchDelete}
          onClose={() => {
            setIsConfirmingBatchDelete(false);
            setBatchDeleteError("");
          }}
          isLoading={isDeletingBatch}
          errorMessage={batchDeleteError}
        />
      )}
    </section>
  );
}
