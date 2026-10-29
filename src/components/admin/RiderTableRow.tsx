/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Fila Individual de Usuario y Chip (SAFE 2026)
 * ARCHIVO: src/components/admin/RiderTableRow.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Componente atómico para renderizar cada fila de usuario motociclista en la
 * tabla de administración. Presenta datos personales, estado de la cuenta,
 * chip vinculado, marcas de tiempo y acciones de activación/desactivación
 * y eliminación segura.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - 100% bilingüe mediante el hook useLocale().
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import type { AdminRiderItem } from "@/lib/api-client";

export interface RiderTableRowProps {
  rider: AdminRiderItem;
  locale: "es" | "en";
  onToggleStatus: (rider: AdminRiderItem) => void;
  onDeleteDevice: (code: string) => void;
  onDeleteUser: (rider: AdminRiderItem) => void;
}

/** Convierte una fecha ISO a texto local legible; vacío si no existe. */
function formatDate(value: string | null, locale: "es" | "en"): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function RiderTableRow({
  rider,
  locale,
  onToggleStatus,
  onDeleteDevice,
  onDeleteUser,
}: RiderTableRowProps) {
  const { t } = useLocale();

  const chipStatusLabel = (status: string): string => {
    if (status === "ACTIVE") return t.common.statusActive;
    if (status === "DISABLED") return t.admin.statusDisabled;
    return t.common.statusUnclaimed;
  };

  return (
    <li className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1.1fr_1fr_1.3fr] gap-2 md:gap-3 px-4 py-3 items-center hover:bg-brand-bg-alt/40 transition-colors">
      {/* 1. Motociclista */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-serif text-sm font-bold text-brand-navy-dark truncate">
          {rider.fullName || t.admin.riderUnnamed}
        </span>
        <span className="font-sans text-xs text-brand-text-desc truncate">
          {rider.email}
        </span>
        {rider.liveRideActive && (
          <span className="inline-flex items-center gap-1.5 font-sans text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t.admin.riderLiveRide}
          </span>
        )}
      </div>

      {/* 2. Chip */}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="md:hidden font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
          {t.admin.columnChip}
        </span>
        {rider.device ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs font-bold text-brand-navy-dark tracking-wide">
              {rider.device.code}
            </span>
            <span
              className={`self-start font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                rider.device.isNfcEncoded
                  ? "bg-brand-nav-active border-brand-nav-blue/30 text-brand-navy-dark"
                  : "bg-brand-bg-alt border-brand-border-subtle text-brand-text-muted"
              }`}
            >
              {rider.device.isNfcEncoded
                ? t.admin.riderNfcEncoded
                : t.admin.riderNfcPending}
            </span>
          </div>
        ) : (
          <span className="font-sans text-xs text-brand-text-muted">
            {t.admin.riderNoChip}
          </span>
        )}
      </div>

      {/* 3. Estado de la Cuenta & Chip */}
      <div className="flex flex-col gap-1">
        <span className="md:hidden font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
          {t.admin.columnStatus}
        </span>
        {/* Badge Cuenta */}
        <span
          className={`self-start inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
            rider.isActive
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-300 text-amber-800"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              rider.isActive ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {rider.isActive ? t.admin.accountActive : t.admin.accountDisabled}
        </span>

        {/* Sub-estado del chip vinculado */}
        {rider.device && (
          <span className="font-sans text-[10px] text-brand-text-muted">
            Chip: {chipStatusLabel(rider.device.status)}
          </span>
        )}
      </div>

      {/* 4. Fechas */}
      <div className="flex flex-col gap-0.5 text-xs text-brand-text-desc">
        <span className="md:hidden font-sans text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
          {t.admin.columnDates}
        </span>
        <span>
          {t.admin.riderRegisteredAt}:{" "}
          <strong className="text-brand-navy-dark font-medium">
            {formatDate(rider.registeredAt, locale)}
          </strong>
        </span>
        <span>
          {t.admin.riderActivatedAt}:{" "}
          <strong className="text-brand-navy-dark font-medium">
            {rider.device?.activatedAt
              ? formatDate(rider.device.activatedAt, locale)
              : t.admin.riderNotActivated}
          </strong>
        </span>
      </div>

      {/* 5. Acciones: Activar/Desactivar Cuenta (principal) + Eliminaciones (secundarias) */}
      <div className="flex flex-wrap md:flex-col gap-1.5 md:items-end justify-start pt-1 md:pt-0">
        <button
          type="button"
          onClick={() => onToggleStatus(rider)}
          className={`min-h-[32px] inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-xs ${
            rider.isActive
              ? "bg-amber-50 border-amber-300 hover:bg-amber-600 hover:text-white text-amber-900"
              : "bg-emerald-50 border-emerald-300 hover:bg-emerald-600 hover:text-white text-emerald-900"
          }`}
          title={rider.isActive ? t.admin.deactivateUserButton : t.admin.activateUserButton}
        >
          <span>{rider.isActive ? "⏸️" : "⚡"}</span>
          <span>{rider.isActive ? t.admin.deactivateUserButton : t.admin.activateUserButton}</span>
        </button>

        <div className="inline-flex items-center gap-1">
          {rider.device && (
            <button
              type="button"
              onClick={() => onDeleteDevice(rider.device!.code)}
              className="min-h-[28px] inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border border-brand-border-field hover:border-brand-accent/50 hover:bg-rose-50 text-brand-text-desc hover:text-brand-accent transition-all cursor-pointer"
              title={t.admin.deleteChipButton}
            >
              <span>🗑️</span>
              <span>{t.admin.deleteChipTitle}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteUser(rider)}
            className="min-h-[28px] inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-rose-50 border border-brand-accent/30 hover:bg-brand-accent hover:text-white text-brand-accent transition-all cursor-pointer"
            title={t.admin.deleteUserButton}
          >
            <span>🗑️</span>
            <span>{t.admin.deleteUserButton}</span>
          </button>
        </div>
      </div>
    </li>
  );
}

