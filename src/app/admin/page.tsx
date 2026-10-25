/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — Centro de Administración (Usuarios, Chips y QR)
 * ARCHIVO: src/app/admin/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Consola privada de operación SAFE. Se organiza en dos áreas claras:
 * 1. Usuarios y chips: cuentas RIDER reales con el folio SAFE vinculado.
 * 2. Generador QR: emisión de lotes, plancha QR e inventario de chips con
 *    grabación de antena NFC mediante Web NFC (sin simuladores de escritorio).
 *
 * Todos los datos provienen de PostgreSQL vía /api/admin/riders y
 * /api/admin/batches. La vista exige sesión con rol ADMIN y no comparte el
 * navbar ni el footer públicos (ver src/app/admin/layout.tsx y PublicChrome).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados, mocks o simuladores en producción.
 * - Textos 100% del diccionario bilingüe y objetivos táctiles de 44px.
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
import { BatchGeneratorCard } from "@/components/admin/BatchGeneratorCard";
import { BatchSelector } from "@/components/admin/BatchSelector";
import { RidersTable } from "@/components/admin/RidersTable";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";

/** Pestañas operativas de la consola administrativa. */
type AdminTab = "riders" | "qr";

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Estados de carga y autenticación
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("riders");

  // Estados de generación de lotes
  const [batchName, setBatchName] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Listado de lotes en base de datos
  const [batches, setBatches] = useState<AdminBatchSummary[]>([]);
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");

  // Inventario de kits del lote seleccionado
  const [devices, setDevices] = useState<AdminDeviceItem[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Usuarios registrados y chips vinculados
  const [riders, setRiders] = useState<AdminRiderItem[]>([]);
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);
  const [ridersError, setRidersError] = useState("");

  // Modales interactivos
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [selectedDeviceForNfc, setSelectedDeviceForNfc] =
    useState<AdminDeviceItem | null>(null);

  // Estados de eliminación
  const [deleteNotice, setDeleteNotice] = useState("");

  // Ref viva del diccionario: los textos de respaldo no re-disparan efectos.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  /** Carga el detalle real de chips de un lote específico. */
  const loadBatchDevices = useCallback(async (name: string) => {
    if (!name) return;
    setIsLoadingDevices(true);
    try {
      const detail = await apiClient.getAdminBatchDetail(name, true);
      setDevices(detail.devices);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : tRef.current.common.errorGeneric;
      setErrorMessage(msg);
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  /** Refresca el resumen real de todos los lotes desde PostgreSQL. */
  const loadBatches = useCallback(async () => {
    try {
      const res = await apiClient.getAdminBatches();
      setBatches(res.batches);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : tRef.current.common.errorGeneric;
      setErrorMessage(msg);
    }
  }, []);

  /** Consulta los usuarios RIDER y su chip vinculado. */
  const loadRiders = useCallback(async () => {
    setIsLoadingRiders(true);
    setRidersError("");
    try {
      const res = await apiClient.getAdminRiders();
      setRiders(res.riders);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : tRef.current.admin.ridersLoadError;
      setRidersError(msg);
    } finally {
      setIsLoadingRiders(false);
    }
  }, []);

  // Inicialización: sesión ADMIN, lotes, primer lote y usuarios registrados
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

        try {
          const res = await apiClient.getAdminBatches();
          if (!isMounted) return;
          setBatches(res.batches);

          if (res.batches.length > 0) {
            const firstBatch = res.batches[0].batchName;
            setSelectedBatchName(firstBatch);
            await loadBatchDevices(firstBatch);
          }
        } catch (err: unknown) {
          if (!isMounted) return;
          const msg =
            err instanceof Error
              ? err.message
              : tRef.current.common.errorGeneric;
          setErrorMessage(msg);
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
    // tRef es estable: conmutar ES/EN no vuelve a inicializar la consola.
  }, [router, loadBatchDevices, loadRiders]);

  /** Cambia el lote abierto en el inventario de chips. */
  const handleSelectBatch = async (name: string) => {
    setSelectedBatchName(name);
    triggerHaptic("light");
    await loadBatchDevices(name);
  };

  /** Emite un lote de folios y PINs reales en PostgreSQL. */
  const handleCreateBatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setErrorMessage("");

    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 1 || qty > 100) {
      triggerHaptic("error");
      setErrorMessage(t.common.errorGeneric);
      return;
    }

    setIsGenerating(true);
    triggerHaptic("light");

    try {
      const created = await apiClient.createAdminBatch(batchName.trim(), qty);

      triggerHaptic("success");
      setNotice(t.admin.batchSuccessNotice);
      setTimeout(() => setNotice(""), 4000);

      setSelectedBatchName(created.batchName);
      await loadBatches();
      await loadBatchDevices(created.batchName);
      setBatchName("");
    } catch (err: unknown) {
      triggerHaptic("error");
      const msg = err instanceof Error ? err.message : t.common.errorGeneric;
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  /** Actualiza un chip grabado dentro de la tira sin cerrar el modal. */
  const handleStripProgress = (
    _index: number,
    _total: number,
    updated: AdminDeviceItem,
  ) => {
    setDevices((prev) =>
      prev.map((device) => (device.code === updated.code ? updated : device)),
    );
  };

  /** Cierra la tira NFC y refresca los contadores reales del lote. */
  const handleStripComplete = () => {
    setSelectedDeviceForNfc(null);
    void loadBatchDevices(selectedBatchName);
    void loadBatches();
  };

  // Recuentos operativos globales (100% derivados de respuestas del backend)
  const linkedChips = riders.filter((rider) => rider.device !== null).length;
  const availableChips = batches.reduce(
    (total, batch) => total + (batch.unclaimedDevices ?? 0),
    0,
  );
  const activeChips = batches.reduce(
    (total, batch) => total + batch.activeDevices,
    0,
  );

  if (isInitializing) {
    return <AdminSkeleton title={t.admin.title} subtitle={t.admin.subtitle} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10 flex flex-col gap-6 animate-fadeInUp">
      {/* Encabezado editorial de la consola */}
      <div className="flex flex-col gap-1.5 border-b border-brand-separator pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" aria-hidden="true" />
          <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
            {t.common.adminPanel} · {t.common.appName}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy-dark leading-tight">
          {t.admin.title}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-brand-text-desc">{t.admin.subtitle}</p>
      </div>

      {/* Resumen operativo global */}
      <AdminMetrics
        registeredRiders={riders.length}
        linkedChips={linkedChips}
        availableChips={availableChips}
        activeChips={activeChips}
      />

      {/* Navegación interna de la consola: pestañas con diseño 2026 */}
      <div role="tablist" aria-label={t.admin.consoleLabel} className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          role="tab"
          id="admin-tab-riders"
          aria-selected={activeTab === "riders"}
          aria-controls="admin-panel-riders"
          onClick={() => setActiveTab("riders")}
          className={`min-h-[48px] px-4 py-2.5 inline-flex items-center justify-between gap-2 border rounded-lg font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "riders"
              ? "bg-brand-navy-dark text-white border-brand-navy-dark shadow-sm"
              : "bg-brand-white text-brand-text-desc border-brand-border-subtle hover:border-brand-border-strong hover:bg-brand-bg-alt hover:text-brand-navy-dark"
          }`}
        >
          <span>{t.admin.tabsRiders}</span>
          <span className="font-normal text-[11px] opacity-80">({riders.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="admin-tab-qr"
          aria-selected={activeTab === "qr"}
          aria-controls="admin-panel-qr"
          onClick={() => setActiveTab("qr")}
          className={`min-h-[48px] px-4 py-2.5 inline-flex items-center justify-between gap-2 border rounded-lg font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "qr"
              ? "bg-brand-navy-dark text-white border-brand-navy-dark shadow-sm"
              : "bg-brand-white text-brand-text-desc border-brand-border-subtle hover:border-brand-border-strong hover:bg-brand-bg-alt hover:text-brand-navy-dark"
          }`}
        >
          <span>{t.admin.tabsQr}</span>
          <span className="font-normal text-[11px] opacity-80">({batches.length})</span>
        </button>
      </div>

      {/* Área 1: usuarios registrados y chips vinculados */}
      {activeTab === "riders" && (
        <div
          id="admin-panel-riders"
          role="tabpanel"
          aria-labelledby="admin-tab-riders"
          className="flex flex-col gap-6"
        >
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

      {/* Área 2: generador QR, emisión de lotes e inventario de chips */}
      {activeTab === "qr" && (
        <div
          id="admin-panel-qr"
          role="tabpanel"
          aria-labelledby="admin-tab-qr"
          className="flex flex-col gap-6"
        >
          <BatchGeneratorCard
            batchName={batchName}
            quantity={quantity}
            isGenerating={isGenerating}
            notice={notice}
            errorMessage={errorMessage}
            onBatchNameChange={setBatchName}
            onQuantityChange={setQuantity}
            onCreate={handleCreateBatch}
          />

          <BatchSelector
            batches={batches}
            selectedBatchName={selectedBatchName}
            onSelect={(name) => void handleSelectBatch(name)}
          />

          {selectedBatchName && (
            <>
              <IncidentHairline variant="subtle" margin="sm" />
              <BatchDeviceList
                devices={devices}
                selectedBatchName={selectedBatchName}
                isLoadingDevices={isLoadingDevices}
                onSelectNfc={(device) => setSelectedDeviceForNfc(device)}
                onPrintQr={() => setShowPrintSheet(true)}
                onDeviceDeleted={() => {
                  setDeleteNotice(t.admin.deviceDeletedNotice);
                  setTimeout(() => setDeleteNotice(""), 4000);
                  void loadBatches();
                  void loadBatchDevices(selectedBatchName);
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Plancha QR del lote seleccionado */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-50 bg-brand-navy-dark/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl my-auto">
            <QrPrintSheet
              batchName={selectedBatchName}
              devices={devices}
              onClose={() => setShowPrintSheet(false)}
            />
          </div>
        </div>
      )}

      {/* Grabador NFC real: arranca en el chip elegido y avanza por pendientes */}
      {selectedDeviceForNfc && (
        <NfcBurstWriterModal
          device={selectedDeviceForNfc}
          devices={devices.filter(
            (device) =>
              !device.isNfcEncoded ||
              device.code === selectedDeviceForNfc.code,
          )}
          onProgress={handleStripProgress}
          onSuccess={handleStripComplete}
          onClose={() => setSelectedDeviceForNfc(null)}
        />
      )}
    </div>
  );
}
