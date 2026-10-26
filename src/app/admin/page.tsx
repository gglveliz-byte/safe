/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — Centro de Administración (Usuarios, Chips y QR)
 * ARCHIVO: src/app/admin/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Consola privada de operaciones SAFE optimizada bajo el diseño SAFE 2026:
 * 1. Resumen de métricas ultra-compacto para maximizar el área útil de trabajo.
 * 2. Emisión de nuevos lotes mediante modal fijo y elegante.
 * 3. Botón de purga total con confirmación de seguridad para vaciar el sistema.
 * 4. Paginación de 20 elementos en motociclistas e inventario de chips.
 * 5. Eliminación de lote completo o chips individuales.
 * 6. Grabación Web NFC en ráfaga continua y modo de formateo/limpieza a fábrica.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Textos 100% bilingües vía useLocale() y táctiles >= 44px.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import {
  apiClient,
  type AdminDeviceItem,
  type AdminBatchSummary,
  type AdminRiderItem,
} from "@/lib/api-client";
import { IncidentHairline } from "@/components/ui/IncidentHairline";
import { QrPrintSheet } from "@/components/admin/QrPrintSheet";
import { NfcBurstWriterModal } from "@/components/admin/NfcBurstWriterModal";
import { BatchDeviceList } from "@/components/admin/BatchDeviceList";
import { BatchSelector } from "@/components/admin/BatchSelector";
import { RidersTable } from "@/components/admin/RidersTable";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { CreateBatchModal } from "@/components/admin/CreateBatchModal";
import { ConfirmPurgeModal } from "@/components/admin/ConfirmPurgeModal";

type AdminTab = "riders" | "qr";

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Estados de carga y navegación
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("riders");

  // Notificaciones y alertas
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteNotice, setDeleteNotice] = useState("");

  // Lotes y dispositivos en base de datos
  const [batches, setBatches] = useState<AdminBatchSummary[]>([]);
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [devices, setDevices] = useState<AdminDeviceItem[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Usuarios registrados y chips vinculados
  const [riders, setRiders] = useState<AdminRiderItem[]>([]);
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);
  const [ridersError, setRidersError] = useState("");

  // Modales interactivos
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [selectedDeviceForNfc, setSelectedDeviceForNfc] = useState<AdminDeviceItem | null>(null);
  const [nfcModalMode, setNfcModalMode] = useState<"write" | "wipe">("write");

  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  /** Carga el detalle real de chips de un lote */
  const loadBatchDevices = useCallback(async (name: string) => {
    if (!name) return;
    setIsLoadingDevices(true);
    try {
      const detail = await apiClient.getAdminBatchDetail(name, true);
      setDevices(detail.devices);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : tRef.current.common.errorGeneric);
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  /** Refresca el resumen de lotes desde PostgreSQL */
  const loadBatches = useCallback(async () => {
    try {
      const res = await apiClient.getAdminBatches();
      setBatches(res.batches);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : tRef.current.common.errorGeneric);
    }
  }, []);

  /** Consulta los usuarios RIDER y su chip vinculado */
  const loadRiders = useCallback(async () => {
    setIsLoadingRiders(true);
    setRidersError("");
    try {
      const res = await apiClient.getAdminRiders();
      setRiders(res.riders);
    } catch (err: unknown) {
      setRidersError(err instanceof Error ? err.message : tRef.current.admin.ridersLoadError);
    } finally {
      setIsLoadingRiders(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function initAdmin() {
      setIsInitializing(true);
      try {
        const session = await apiClient.getSession();
        if (!isMounted) return;
        if (!session.authenticated || session.user?.role !== "ADMIN") {
          router.replace("/login");
          return;
        }
        void loadRiders();
        const res = await apiClient.getAdminBatches();
        if (!isMounted) return;
        setBatches(res.batches);
        if (res.batches.length > 0) {
          const firstBatch = res.batches[0].batchName;
          setSelectedBatchName(firstBatch);
          await loadBatchDevices(firstBatch);
        }
      } catch {
        if (!isMounted) return;
        router.replace("/login");
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }
    initAdmin();
    return () => {
      isMounted = false;
    };
  }, [router, loadBatchDevices, loadRiders]);

  const handleSelectBatch = async (name: string) => {
    setSelectedBatchName(name);
    triggerHaptic("light");
    await loadBatchDevices(name);
  };

  const handleCreateBatch = async (name: string, quantity: number): Promise<boolean> => {
    try {
      const created = await apiClient.createAdminBatch(name, quantity);
      triggerHaptic("success");
      setNotice(t.admin.batchSuccessNotice);
      setTimeout(() => setNotice(""), 4500);
      setSelectedBatchName(created.batchName);
      await loadBatches();
      await loadBatchDevices(created.batchName);
      return true;
    } catch (err: unknown) {
      triggerHaptic("error");
      throw err;
    }
  };

  const handleConfirmPurge = async (): Promise<boolean> => {
    try {
      const res = await apiClient.purgeAllAdminData();
      if (!res.success) throw new Error(res.message || t.admin.deleteError);
      triggerHaptic("success");
      setNotice(t.admin.purgeSuccessNotice);
      setTimeout(() => setNotice(""), 6000);
      setSelectedBatchName("");
      setDevices([]);
      await loadRiders();
      await loadBatches();
      return true;
    } catch (err: unknown) {
      triggerHaptic("error");
      throw err;
    }
  };

  const handleBatchDeleted = async () => {
    setDeleteNotice(t.admin.batchDeletedNotice);
    setTimeout(() => setDeleteNotice(""), 4500);
    setDevices([]);
    setSelectedBatchName("");
    await loadBatches();
    void loadRiders();
  };

  const handleStripProgress = (_index: number, _total: number, updated: AdminDeviceItem) => {
    setDevices((prev) => prev.map((device) => (device.code === updated.code ? updated : device)));
  };

  const handleStripComplete = () => {
    setSelectedDeviceForNfc(null);
    void loadBatchDevices(selectedBatchName);
    void loadBatches();
  };

  const linkedChips = riders.filter((rider) => rider.device !== null).length;
  const availableChips = batches.reduce((tot, b) => tot + (b.unclaimedDevices ?? 0), 0);
  const activeChips = batches.reduce((tot, b) => tot + b.activeDevices, 0);

  // Bloqueo estricto de scroll en documentElement y body al abrir modales para evitar bleeding y saltos en PC y móvil
  useEffect(() => {
    const isModalOpen = showPrintSheet || selectedDeviceForNfc !== null || showCreateBatchModal || showPurgeModal;
    if (isModalOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showPrintSheet, selectedDeviceForNfc, showCreateBatchModal, showPurgeModal]);

  if (isInitializing) {
    return <AdminSkeleton title={t.admin.title} subtitle={t.admin.subtitle} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-3 sm:py-4 flex flex-col gap-3">
      {/* Encabezado editorial compacto con botones de acción global */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-brand-separator pb-2.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" aria-hidden="true" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
              {t.common.adminPanel} · {t.common.appName}
            </span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-brand-navy-dark leading-tight">
            {t.admin.title}
          </h1>
          <p className="font-sans text-[11px] sm:text-xs text-brand-text-desc">{t.admin.subtitle}</p>
        </div>

        {/* Acciones principales: Nuevo Lote y Vaciar Todo */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setShowCreateBatchModal(true);
            }}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-navy-dark hover:bg-brand-navy-secondary text-white text-xs font-semibold rounded-lg shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer"
          >
            <span>+</span>
            <span>{t.admin.newBatchModalButton}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setShowPurgeModal(true);
            }}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-50 border border-brand-accent/30 hover:bg-brand-accent hover:text-white text-brand-accent text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            title={t.admin.purgeSubtitle}
          >
            <span>🚨</span>
            <span>{t.admin.purgeButton}</span>
          </button>
        </div>
      </div>

      {/* Avisos de confirmación */}
      {(notice || deleteNotice) && (
        <div role="status" aria-live="polite" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-sans font-medium flex items-center justify-between gap-2 shadow-xs">
          <span>✓ {notice || deleteNotice}</span>
          <button type="button" onClick={() => { setNotice(""); setDeleteNotice(""); }} className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold px-1">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Barra Unificada de Pestañas y Métricas Operativas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div role="tablist" aria-label={t.admin.consoleLabel} className="inline-flex bg-brand-white border border-brand-border-subtle p-1 rounded-xl shadow-xs shrink-0">
          <button
            type="button"
            role="tab"
            id="admin-tab-riders"
            aria-selected={activeTab === "riders"}
            aria-controls="admin-panel-riders"
            onClick={() => setActiveTab("riders")}
            className={`min-h-[38px] px-3.5 py-1.5 inline-flex items-center gap-2 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
              activeTab === "riders"
                ? "bg-brand-navy-dark text-white shadow-xs"
                : "text-brand-text-desc hover:text-brand-navy-dark hover:bg-brand-bg-alt"
            }`}
          >
            <span>{t.admin.tabsRiders}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${activeTab === "riders" ? "bg-white/20 text-white" : "bg-brand-bg-alt text-brand-text-muted"}`}>
              {riders.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="admin-tab-qr"
            aria-selected={activeTab === "qr"}
            aria-controls="admin-panel-qr"
            onClick={() => setActiveTab("qr")}
            className={`min-h-[38px] px-3.5 py-1.5 inline-flex items-center gap-2 rounded-lg font-sans text-xs font-bold transition-all cursor-pointer ${
              activeTab === "qr"
                ? "bg-brand-navy-dark text-white shadow-xs"
                : "text-brand-text-desc hover:text-brand-navy-dark hover:bg-brand-bg-alt"
            }`}
          >
            <span>{t.admin.tabsQr}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${activeTab === "qr" ? "bg-white/20 text-white" : "bg-brand-bg-alt text-brand-text-muted"}`}>
              {batches.length}
            </span>
          </button>
        </div>

        {/* Métricas compactas integradas */}
        <div className="flex-1 lg:max-w-xl">
          <AdminMetrics registeredRiders={riders.length} linkedChips={linkedChips} availableChips={availableChips} activeChips={activeChips} />
        </div>
      </div>

      {/* Área 1: Usuarios registrados y chips vinculados (Paginada por 20) */}
      {activeTab === "riders" && (
        <div id="admin-panel-riders" role="tabpanel" aria-labelledby="admin-tab-riders" className="flex flex-col gap-4">
          <RidersTable
            riders={riders}
            isLoading={isLoadingRiders}
            errorMessage={ridersError}
            onRefresh={() => void loadRiders()}
            onUserDeleted={() => {
              setDeleteNotice(t.admin.userDeletedNotice);
              setTimeout(() => setDeleteNotice(""), 4000);
              void loadRiders();
            }}
            onDeviceDeleted={() => {
              setDeleteNotice(t.admin.deviceDeletedNotice);
              setTimeout(() => setDeleteNotice(""), 4000);
              void loadBatches();
            }}
          />
        </div>
      )}

      {/* Área 2: Lotes e Inventario de chips (Paginado por 20 con ráfaga) */}
      {activeTab === "qr" && (
        <div id="admin-panel-qr" role="tabpanel" aria-labelledby="admin-tab-qr" className="flex flex-col gap-4">
          <BatchSelector batches={batches} selectedBatchName={selectedBatchName} onSelect={(name) => void handleSelectBatch(name)} />

          {selectedBatchName && (
            <BatchDeviceList
                devices={devices}
                selectedBatchName={selectedBatchName}
                isLoadingDevices={isLoadingDevices}
                onSelectNfc={(device) => {
                  setNfcModalMode("write");
                  setSelectedDeviceForNfc(device);
                }}
                onSelectWipeNfc={(device) => {
                  setNfcModalMode("wipe");
                  setSelectedDeviceForNfc(device);
                }}
                onStartBurstWriting={(batchDevices) => {
                  if (batchDevices.length === 0) return;
                  const firstPending = batchDevices.find((d) => !d.isNfcEncoded) || batchDevices[0];
                  setNfcModalMode("write");
                  setSelectedDeviceForNfc(firstPending);
                }}
                onPrintQr={() => setShowPrintSheet(true)}
                onDeviceDeleted={() => {
                  setDeleteNotice(t.admin.deviceDeletedNotice);
                  setTimeout(() => setDeleteNotice(""), 4000);
                  void loadBatches();
                  void loadBatchDevices(selectedBatchName);
                }}
                onBatchDeleted={handleBatchDeleted}
              />
          )}
        </div>
      )}

      {/* Modal: Creación de Nuevo Lote de Chips */}
      <CreateBatchModal isOpen={showCreateBatchModal} onClose={() => setShowCreateBatchModal(false)} onCreate={handleCreateBatch} />

      {/* Modal: Purga Total del Sistema */}
      <ConfirmPurgeModal isOpen={showPurgeModal} onClose={() => setShowPurgeModal(false)} onConfirmPurge={handleConfirmPurge} />

      {/* Plancha QR del lote */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-50 bg-brand-white sm:bg-brand-navy-dark/85 sm:backdrop-blur-md flex flex-col items-center justify-start p-0 sm:p-6 md:p-8 overflow-y-auto">
          <div className="w-full min-h-dvh sm:min-h-0 sm:max-w-5xl lg:max-w-6xl my-0 sm:my-4 flex flex-col bg-brand-white sm:rounded-2xl sm:shadow-2xl sm:border border-brand-border-subtle">
            <QrPrintSheet batchName={selectedBatchName} devices={devices} onClose={() => setShowPrintSheet(false)} />
          </div>
        </div>
      )}

      {/* Grabador y Limpiador NFC Móvil en Ráfaga */}
      {selectedDeviceForNfc && (
        <NfcBurstWriterModal
          device={selectedDeviceForNfc}
          devices={devices}
          batchName={selectedBatchName}
          initialMode={nfcModalMode}
          onProgress={handleStripProgress}
          onSuccess={handleStripComplete}
          onClose={() => setSelectedDeviceForNfc(null)}
        />
      )}
    </div>
  );
}
