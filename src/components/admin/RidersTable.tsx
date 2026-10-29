/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Tabla de Cuentas y Chips Vinculados (SAFE 2026)
 * ARCHIVO: src/components/admin/RidersTable.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Tabla operativa de cuentas RIDER reales con su chip SAFE vinculado:
 * 1. Búsqueda instantánea local por nombre, correo o folio.
 * 2. Filtro rápido por estado de cuenta (Todas, Activas, Desactivadas).
 * 3. Activación y Desactivación de cuentas sin borrar datos (soft-status).
 * 4. Paginación elegante de 20 motociclistas por página.
 * 5. Eliminación de usuario o de chip individual (con confirmación de seguridad).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero usuarios inventados: datos reales de Neon PostgreSQL.
 * - 100% bilingüe vía useLocale().
 * ==============================================================================
 */

"use client";

import React, { useMemo, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useHaptic } from "@/hooks/useHaptic";
import { apiClient } from "@/lib/api-client";
import type { AdminRiderItem } from "@/lib/api-client";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { ConfirmAccountStatusModal } from "@/components/admin/ConfirmAccountStatusModal";
import { RiderTableRow } from "@/components/admin/RiderTableRow";

export interface RidersTableProps {
  /** Usuarios RIDER reales con su chip vinculado. */
  riders: AdminRiderItem[];
  /** Indica que la consulta a PostgreSQL está en curso. */
  isLoading: boolean;
  /** Error humano de la última consulta, vacío si fue exitosa. */
  errorMessage: string;
  /** Vuelve a consultar la lista de usuarios. */
  onRefresh: () => void;
  /** Callback cuando se actualiza el estado de una cuenta. */
  onUserStatusChanged?: (userId: string, isActive: boolean) => void;
  /** Callback cuando se elimina un usuario (opcional: para UI sync). */
  onUserDeleted?: (userId: string) => void;
  /** Callback cuando se elimina un chip (opcional: para UI sync). */
  onDeviceDeleted?: (code: string) => void;
}

const PAGE_SIZE = 20;

export function RidersTable({
  riders,
  isLoading,
  errorMessage,
  onRefresh,
  onUserStatusChanged,
  onUserDeleted,
  onDeviceDeleted,
}: RidersTableProps) {
  const { t, locale } = useLocale();
  const { triggerHaptic } = useHaptic();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

  // Estado del modal de activación / desactivación
  const [statusTarget, setStatusTarget] = useState<{
    rider: AdminRiderItem;
    targetActive: boolean;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Estado del modal de confirmación de eliminación
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "user"; rider: AdminRiderItem }
    | { type: "device"; code: string }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Filtrado instantáneo por estado y texto
  const filteredRiders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return riders.filter((rider) => {
      if (statusFilter === "active" && !rider.isActive) return false;
      if (statusFilter === "disabled" && rider.isActive) return false;
      if (!normalizedQuery) return true;
      const searchable = [
        rider.fullName || "",
        rider.email,
        rider.device?.code || "",
      ].join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, riders, statusFilter]);

  // Paginación de 20 elementos por vista
  const totalPages = Math.max(1, Math.ceil(filteredRiders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRiders = filteredRiders.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const chipStatusLabel = (status: string): string => {
    if (status === "ACTIVE") return t.common.statusActive;
    if (status === "DISABLED") return t.admin.statusDisabled;
    return t.common.statusUnclaimed;
  };

  const handleToggleStatus = (rider: AdminRiderItem) => {
    triggerHaptic("light");
    setStatusTarget({
      rider,
      targetActive: !rider.isActive,
    });
    setStatusError("");
  };

  const handleConfirmStatus = async (): Promise<boolean> => {
    if (!statusTarget) return false;
    setIsUpdatingStatus(true);
    setStatusError("");
    try {
      const res = await apiClient.toggleAdminRiderStatus(
        statusTarget.rider.id,
        statusTarget.targetActive,
      );
      if (!res.success) {
        throw new Error(res.message || t.common.errorGeneric);
      }
      triggerHaptic("success");
      onUserStatusChanged?.(statusTarget.rider.id, statusTarget.targetActive);
      onRefresh();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.common.errorGeneric;
      setStatusError(msg);
      triggerHaptic("error");
      return false;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteUser = (rider: AdminRiderItem) => {
    triggerHaptic("light");
    setDeleteTarget({ type: "user", rider });
    setDeleteError("");
  };

  const handleDeleteDevice = (code: string) => {
    triggerHaptic("light");
    setDeleteTarget({ type: "device", code });
    setDeleteError("");
  };

  const handleConfirmDelete = async (): Promise<boolean> => {
    if (!deleteTarget) return false;
    setIsDeleting(true);
    setDeleteError("");

    try {
      if (deleteTarget.type === "user") {
        const result = await apiClient.deleteAdminRider(deleteTarget.rider.id);
        if (!result.success) throw new Error(result.message || t.admin.deleteError);
        triggerHaptic("success");
        onUserDeleted?.(deleteTarget.rider.id);
        return true;
      } else {
        const result = await apiClient.deleteAdminDevice(deleteTarget.code);
        if (!result.success) throw new Error(result.message || t.admin.deleteError);
        triggerHaptic("success");
        onDeviceDeleted?.(deleteTarget.code);
        return true;
      }
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
    <section className="bg-brand-white border border-brand-border-subtle rounded-xl p-5 sm:p-6 shadow-xs hover:border-brand-border-strong flex flex-col gap-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-brand-navy-dark leading-tight">
            {t.admin.ridersTitle}{" "}
            <span className="font-sans text-xs font-normal text-brand-text-muted">
              ({filteredRiders.length} de {riders.length})
            </span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-text-desc mt-0.5">
            {t.admin.ridersSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="min-h-[40px] self-start sm:self-auto inline-flex items-center justify-center px-3.5 py-1.5 bg-brand-white border border-brand-border-field hover:bg-brand-bg-alt text-brand-navy-dark text-xs font-semibold rounded-lg shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-brand-nav-blue cursor-pointer disabled:opacity-60"
        >
          <span className={isLoading ? "animate-spin mr-1.5" : "mr-1.5"}>↻</span>
          {t.admin.ridersRefresh}
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={t.admin.ridersSearchPlaceholder}
            aria-label={t.admin.ridersSearchPlaceholder}
            className="safe-input-focus h-10 w-full px-3.5 bg-brand-white border border-brand-border-field rounded-lg font-sans text-sm text-brand-navy-dark placeholder-brand-text-muted"
          />
        </div>

        {/* Filtro rápido de estados */}
        <div className="inline-flex bg-brand-bg-alt border border-brand-border-field rounded-lg p-0.5 self-start sm:self-auto shrink-0 text-xs">
          <button
            type="button"
            onClick={() => { setStatusFilter("all"); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-sans font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-brand-white text-brand-navy-dark shadow-xs"
                : "text-brand-text-desc hover:text-brand-navy-dark"
            }`}
          >
            {t.admin.filterAllAccounts}
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter("active"); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-sans font-semibold transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-brand-white text-emerald-800 shadow-xs"
                : "text-brand-text-desc hover:text-emerald-800"
            }`}
          >
            {t.admin.filterActiveAccounts}
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter("disabled"); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-sans font-semibold transition-all cursor-pointer ${
              statusFilter === "disabled"
                ? "bg-brand-white text-amber-800 shadow-xs"
                : "text-brand-text-desc hover:text-amber-800"
            }`}
          >
            {t.admin.filterDisabledAccounts}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-brand-accent/30 rounded-lg text-xs text-brand-accent font-sans text-center font-medium"
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="p-8 border border-dashed border-brand-border-subtle rounded-xl bg-brand-bg-alt text-center"
        >
          <p className="font-sans text-xs text-brand-text-muted">
            {t.admin.ridersLoading}
          </p>
        </div>
      ) : riders.length === 0 ? (
        <div className="p-8 border border-dashed border-brand-border-subtle rounded-xl bg-brand-bg-alt text-center">
          <p className="font-sans text-xs text-brand-text-muted">
            {t.admin.ridersEmpty}
          </p>
        </div>
      ) : filteredRiders.length === 0 ? (
        <div className="p-8 border border-dashed border-brand-border-subtle rounded-xl bg-brand-bg-alt text-center">
          <p className="font-sans text-xs text-brand-text-muted">
            {t.admin.ridersNoResults}
          </p>
        </div>
      ) : (
        <div className="border border-brand-border-subtle rounded-xl bg-brand-white overflow-hidden shadow-xs">
          <div className="hidden md:grid md:grid-cols-[1.4fr_1fr_1.1fr_1fr_1.3fr] gap-3 px-4 py-2.5 bg-brand-bg-alt border-b border-brand-border-subtle text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
            <span>{t.admin.columnRider}</span>
            <span>{t.admin.columnChip}</span>
            <span>{t.admin.columnStatus}</span>
            <span>{t.admin.columnDates}</span>
            <span className="text-right">{t.admin.actionsLabel}</span>
          </div>

          <ul className="divide-y divide-brand-separator">
            {paginatedRiders.map((rider) => (
              <RiderTableRow
                key={rider.id}
                rider={rider}
                locale={locale}
                onToggleStatus={handleToggleStatus}
                onDeleteDevice={handleDeleteDevice}
                onDeleteUser={handleDeleteUser}
              />
            ))}
          </ul>

          {/* Barra de Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-brand-bg-alt border-t border-brand-border-subtle text-xs font-sans">
              <span className="text-brand-text-muted">
                {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, filteredRiders.length)} de {filteredRiders.length}
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

      {/* Modal de confirmación de activación / desactivación */}
      {statusTarget && (
        <ConfirmAccountStatusModal
          rider={statusTarget.rider}
          targetActive={statusTarget.targetActive}
          onConfirm={handleConfirmStatus}
          onClose={() => {
            setStatusTarget(null);
            setStatusError("");
          }}
          isLoading={isUpdatingStatus}
          errorMessage={statusError}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title={
            deleteTarget.type === "user"
              ? t.admin.deleteUserTitle
              : t.admin.deleteChipTitle
          }
          message={
            deleteTarget.type === "user"
              ? t.admin.deleteUserMessage
              : t.admin.deleteChipMessage
          }
          details={
            deleteTarget.type === "user"
              ? {
                  [t.admin.columnRider]: `${deleteTarget.rider.fullName || t.admin.riderUnnamed}`,
                  [t.login.emailLabel]: deleteTarget.rider.email,
                  ...(deleteTarget.rider.device
                    ? {
                        [t.admin.columnChip]: deleteTarget.rider.device.code,
                        [t.admin.columnStatus]: chipStatusLabel(
                          deleteTarget.rider.device.status,
                        ),
                      }
                    : {}),
                }
              : {
                  [t.admin.columnChip]: deleteTarget.code,
                }
          }
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
