/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Vistas Oficiales — VISTA 6: Fábrica Móvil y Centro de Emisión Admin
 * ARCHIVO: src/app/admin/page.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Panel de control y manufactura para el administrador y operarios de fábrica.
 * Conectado 100% al backend PostgreSQL en Neon:
 * 1. Emisión atómica de lotes de folios secuenciales (SAFE-XXXX) con PINs de 6 dígitos.
 * 2. Carga y selección de lotes existentes con métricas de grabado y activación.
 * 3. Previsualización e impresión de planchas de stickers QR vectoriales.
 * 4. Grabado continuo en serie de antenas NFC (NTAG216) mediante Web NFC API
 *    o simulador de laboratorio para PC.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Verificación de privilegios de administrador al montar.
 * ==============================================================================
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import {
  apiClient,
  type AdminDeviceItem,
  type AdminBatchSummary,
} from "@/lib/api-client";
import { IncidentCard } from "@/components/ui/IncidentCard";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { IncidentHairline } from "@/components/ui/IncidentHairline";
import { QrPrintSheet } from "@/components/admin/QrPrintSheet";
import { NfcBurstWriterModal } from "@/components/admin/NfcBurstWriterModal";
import { NfcSimulatorModal } from "@/components/admin/NfcSimulatorModal";
import { BatchDeviceList } from "@/components/admin/BatchDeviceList";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { ProductionSummary } from "@/components/admin/ProductionSummary";

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { triggerHaptic } = useHaptic();

  // Estados de carga y autenticación
  const [isInitializing, setIsInitializing] = useState(true);

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

  // Modales interactivos
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [selectedDeviceForNfc, setSelectedDeviceForNfc] = useState<AdminDeviceItem | null>(null);
  const [selectedDeviceForSimulator, setSelectedDeviceForSimulator] = useState<AdminDeviceItem | null>(null);

  // Carga el detalle de dispositivos de un lote específico
  const loadBatchDevices = useCallback(
    async (bName: string) => {
      if (!bName) return;
      setIsLoadingDevices(true);
      try {
        const detail = await apiClient.getAdminBatchDetail(bName, true);
        setDevices(detail.devices);
      } catch (err: unknown) {
        // M-12: fallback humano desde el diccionario (texto en duro erradicado)
        const msg = err instanceof Error ? err.message : t.common.errorGeneric;
        setErrorMessage(msg);
      } finally {
        setIsLoadingDevices(false);
      }
    },
    [t],
  );

  // Inicialización y verificación de privilegios de ADMIN
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

        // Consultar lotes reales en PostgreSQL
        const res = await apiClient.getAdminBatches();
        if (!isMounted) return;

        setBatches(res.batches);

        if (res.batches.length > 0) {
          const firstBatch = res.batches[0].batchName;
          setSelectedBatchName(firstBatch);
          await loadBatchDevices(firstBatch);
        }
        // M-12: sin lotes previos el campo queda vacío; el placeholder del
        // diccionario guía al operario ("Lote-Fabrica-01" fabricado erradicado).
      } catch {
        if (!isMounted) return;
        router.replace("/login");
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initAdmin();
    return () => {
      isMounted = false;
    };
  }, [router, loadBatchDevices]);

  // Cambio de lote seleccionado
  const handleSelectBatch = async (name: string) => {
    setSelectedBatchName(name);
    triggerHaptic("light");
    await loadBatchDevices(name);
  };

  // Creación de nuevo lote en Neon PostgreSQL
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    setErrorMessage("");

    // M-6: cero cantidades fabricadas: si el valor no es un entero válido en
    // el rango oficial 1-100, error humano y NO se inventa un lote (`|| 5` erradicado).
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

      // Actualizar listado de dispositivos y seleccionar nuevo lote
      setDevices(created.devices);
      setSelectedBatchName(created.batchName);

      // Refrescar listado de lotes agregados
      const res = await apiClient.getAdminBatches();
      setBatches(res.batches);

      // Limpiar formulario para el siguiente
      setBatchName("");
    } catch (err: unknown) {
      triggerHaptic("error");
      // M-12: fallback humano desde el diccionario (texto en duro erradicado)
      const msg = err instanceof Error ? err.message : t.common.errorGeneric;
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Ráfaga en tira (flujo 2.2): refresca cada chip grabado en el listado local
  // sin cerrar el modal, usando el device REAL devuelto por el backend.
  const handleStripProgress = (
    _index: number,
    _total: number,
    updated: AdminDeviceItem,
  ) => {
    setDevices((prev) => prev.map((d) => (d.code === updated.code ? updated : d)));
  };

  // Ráfaga en tira: al concluir la tira cierra el modal y refresca el detalle del
  // lote desde el servidor (contadores veraces, sin incrementos locales).
  const handleStripComplete = () => {
    setSelectedDeviceForNfc(null);
    void loadBatchDevices(selectedBatchName ?? "");
  };

  // Notificación tras grabado exitoso de antena física o simulada
  const handleDeviceEncoded = (updated: AdminDeviceItem) => {
    setDevices((prev) =>
      prev.map((d) => (d.code === updated.code ? updated : d)),
    );
    setSelectedDeviceForNfc(null);
    setSelectedDeviceForSimulator(null);

    // Actualizar contadores locales del lote
    setBatches((prev) =>
      prev.map((b) =>
        b.batchName === selectedBatchName
          ? { ...b, encodedDevices: b.encodedDevices + 1 }
          : b,
      ),
    );
  };

  // Contadores métricos dinámicos
  const totalCount = devices.length;
  const unclaimedCount = devices.filter((d) => d.status === "UNCLAIMED").length;
  const activeCount = devices.filter((d) => d.status === "ACTIVE").length;

  if (isInitializing) {
    // Skeleton extraído a componente propio (partición obligatoria de la zona crítica)
    return <AdminSkeleton title={t.admin.title} subtitle={t.admin.subtitle} />;
  }

  return (
    <div className="safe-mobile-container py-8 sm:py-12 flex flex-col gap-8">
      {/* Encabezado Broadsheet */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ink pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-orange" />
            {/* C-13: eyebrow desde el diccionario bilingüe (texto en duro erradicado) */}
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-carbon">
              {t.common.adminPanel} · {t.common.appName}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight">
            {t.admin.title}
          </h1>
          <p className="font-sans text-micro text-carbon">
            {t.admin.subtitle}
          </p>
        </div>

        <IncidentButton
          variant="neutral"
          size="sm"
          onClick={() => apiClient.logout()}
        >
          🚪 {t.dashboard.logoutButton}
        </IncidentButton>
      </div>

      {/* Resumen Métrico de Producción (componente extraído; cifras reales del lote) */}
      <ProductionSummary
        totalCount={totalCount}
        unclaimedCount={unclaimedCount}
        activeCount={activeCount}
      />

      {/* Formulario de Emisión de Lotes */}
      <IncidentCard padding="md" className="flex flex-col gap-4">
        <div>
          <h3 className="font-serif font-bold text-heading-sm text-ink leading-tight">
            {t.admin.batchTitle}
          </h3>
          <p className="font-sans text-micro text-carbon mt-0.5">
            {t.admin.batchSubtitle}
          </p>
        </div>

        <form
          onSubmit={handleCreateBatch}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
        >
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.admin.batchNameLabel}
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              required
              placeholder={t.admin.batchNamePlaceholder}
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-micro font-bold uppercase text-carbon">
              {t.admin.quantityLabel}
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder={t.admin.quantityPlaceholder}
              className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="sm:col-span-3 flex flex-wrap items-center gap-3 pt-2">
            <IncidentButton
              type="submit"
              variant="emergency"
              isLoading={isGenerating}
              disabled={isGenerating}
            >
              {isGenerating
                ? t.admin.generatingBatch
                : `+ ${t.admin.createBatchButton}`}
            </IncidentButton>

            {devices.length > 0 && (
              <IncidentButton
                type="button"
                variant="paper"
                onClick={() => setShowPrintSheet(true)}
              >
                🖨️ {t.admin.printQrsButton}
              </IncidentButton>
            )}
          </div>
        </form>

        {/* C-16: éxito sobrio en concrete/ink (verdes erradicados) y error con
            la clase oficial .banner-emergency (bg-red-50 erradicado) */}
        {notice && (
          <div role="status" className="p-3 bg-concrete border border-ink rounded-[6px] text-micro text-ink font-sans text-center font-bold">
            ✓ {notice}
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="banner-emergency text-micro text-alert-red font-sans text-center">
            ⚠️ {errorMessage}
          </div>
        )}
      </IncidentCard>

      {/* Selector de Lotes Producidos */}
      {batches.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* C-13: etiqueta desde el diccionario (texto en duro erradicado) */}
          <label className="font-sans text-micro font-bold uppercase text-carbon">
            {t.admin.generatedBatchesTitle} ({batches.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {batches.map((b) => (
              <button
                key={b.batchName}
                type="button"
                onClick={() => handleSelectBatch(b.batchName)}
                title={`${b.totalDevices} ${t.admin.totalKitsLabel}`}
                className={`min-h-[44px] px-3 py-2 inline-flex items-center border rounded-[4px] font-sans text-micro font-bold transition-all ${
                  selectedBatchName === b.batchName
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper text-ink border-mist hover:border-ink"
                }`}
              >
                {/* C-13: métricas numéricas puras; etiqueta del diccionario vía tooltip */}
                {b.batchName} ({b.totalDevices} · {b.encodedDevices})
              </button>
            ))}
          </div>
        </div>
      )}

      <IncidentHairline variant="subtle" />

      {/* Lista de Kits Emitidos del Lote Seleccionado */}
      <BatchDeviceList
        devices={devices}
        selectedBatchName={selectedBatchName}
        isLoadingDevices={isLoadingDevices}
        onSelectNfc={(dev) => setSelectedDeviceForNfc(dev)}
        onSelectSimulator={(dev) => setSelectedDeviceForSimulator(dev)}
      />

      {/* Modal de Plancha de Impresión QR */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl my-auto">
            <QrPrintSheet
              batchName={selectedBatchName || batchName}
              devices={devices}
              onClose={() => setShowPrintSheet(false)}
            />
          </div>
        </div>
      )}

      {/* Modal Grabador NFC Móvil — tira secuencial completa del lote (flujo 2.2):
          arranca en el folio seleccionado y avanza chip a chip por los pendientes */}
      {selectedDeviceForNfc && (
        <NfcBurstWriterModal
          device={selectedDeviceForNfc}
          devices={devices.filter((d) => !d.isNfcEncoded)}
          onProgress={handleStripProgress}
          onSuccess={handleStripComplete}
          onClose={() => setSelectedDeviceForNfc(null)}
        />
      )}

      {/* Modal Simulador de Antena para PC */}
      {selectedDeviceForSimulator && (
        <NfcSimulatorModal
          device={selectedDeviceForSimulator}
          onSuccess={handleDeviceEncoded}
          onClose={() => setSelectedDeviceForSimulator(null)}
        />
      )}
    </div>
  );
}
