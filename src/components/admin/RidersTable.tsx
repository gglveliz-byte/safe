/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Usuarios Registrados y Chips Vinculados
 * ARCHIVO: src/components/admin/RidersTable.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Tabla operativa de cuentas RIDER reales con el chip SAFE que tienen
 * vinculado. Permite buscar por nombre, correo o folio y actualizar la lista
 * contra GET /api/admin/riders. En móvil cada registro se apila como tarjeta
 * con microetiquetas; en escritorio se alinea en columnas editoriales.
 *
 * ENTRADAS: riders, estado de carga/error y callback de actualización.
 * SALIDAS: búsqueda filtrada, tabla responsiva y estado vacío veraz.
 * DEPENDENCIAS: useLocale, IncidentButton, AdminRiderItem.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero usuarios de demostración: los datos provienen de PostgreSQL.
 * - Objetivos táctiles mínimos de 44x44px.
 * ==============================================================================
 */

"use client";

import React, { useMemo, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentButton } from "@/components/ui/IncidentButton";
import type { AdminRiderItem } from "@/lib/api-client";

export interface RidersTableProps {
  /** Usuarios RIDER reales con su chip vinculado. */
  riders: AdminRiderItem[];
  /** Indica que la consulta a PostgreSQL está en curso. */
  isLoading: boolean;
  /** Error humano de la última consulta, vacío si fue exitosa. */
  errorMessage: string;
  /** Vuelve a consultar la lista de usuarios. */
  onRefresh: () => void;
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

/**
 * Tabla de usuarios con búsqueda local instantánea.
 * El estado del chip se rotula con el diccionario; nunca se inventa ACTIVE.
 */
export function RidersTable({
  riders,
  isLoading,
  errorMessage,
  onRefresh,
}: RidersTableProps) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");

  // Filtrado instantáneo por nombre, correo o folio, sin consultas adicionales.
  const filteredRiders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return riders;
    return riders.filter((rider) => {
      const searchable = [
        rider.fullName || "",
        rider.email,
        rider.device?.code || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, riders]);

  /** Rotula el estado real del chip según el enum de PostgreSQL. */
  const chipStatusLabel = (status: string): string => {
    if (status === "ACTIVE") return t.common.statusActive;
    if (status === "DISABLED") return t.admin.statusDisabled;
    return t.common.statusUnclaimed;
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif font-bold text-heading-sm text-ink leading-tight">
          {t.admin.ridersTitle}{" "}
          <span className="font-sans text-micro text-carbon">
            ({riders.length})
          </span>
        </h2>
        <p className="font-sans text-micro text-carbon">
          {t.admin.ridersSubtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.admin.ridersSearchPlaceholder}
          aria-label={t.admin.ridersSearchPlaceholder}
          className="h-11 flex-1 px-3 bg-paper border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
        <IncidentButton
          type="button"
          variant="neutral"
          onClick={onRefresh}
          isLoading={isLoading}
          disabled={isLoading}
        >
          ↻ {t.admin.ridersRefresh}
        </IncidentButton>
      </div>

      {errorMessage && (
        <div role="alert" className="banner-emergency text-micro text-alert-red font-sans text-center">
          ⚠️ {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="p-8 border border-dashed border-mist rounded-[8px] bg-paper text-center"
        >
          <p className="font-sans text-micro text-carbon">
            {t.admin.ridersLoading}
          </p>
        </div>
      ) : riders.length === 0 ? (
        <div className="p-8 border border-dashed border-mist rounded-[8px] bg-paper text-center">
          <p className="font-sans text-micro text-carbon">
            {t.admin.ridersEmpty}
          </p>
        </div>
      ) : filteredRiders.length === 0 ? (
        <div className="p-8 border border-dashed border-mist rounded-[8px] bg-paper text-center">
          <p className="font-sans text-micro text-carbon">
            {t.admin.ridersNoResults}
          </p>
        </div>
      ) : (
        <div className="border border-ink rounded-[8px] bg-paper overflow-hidden">
          {/* Cabecera editorial visible solo en pantallas medianas o mayores */}
          <div className="hidden md:grid md:grid-cols-[1.5fr_1.1fr_1fr_1fr] gap-3 px-4 py-2 bg-concrete border-b border-ink">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-carbon">
              {t.admin.columnRider}
            </span>
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-carbon">
              {t.admin.columnChip}
            </span>
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-carbon">
              {t.admin.columnStatus}
            </span>
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-carbon">
              {t.admin.columnDates}
            </span>
          </div>

          <ul className="divide-y divide-mist">
            {filteredRiders.map((rider) => (
              <li
                key={rider.id}
                className="grid grid-cols-1 md:grid-cols-[1.5fr_1.1fr_1fr_1fr] gap-2 md:gap-3 px-4 py-3 items-start"
              >
                {/* Identidad del motociclista */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-serif text-body font-bold text-ink truncate">
                    {rider.fullName || t.admin.riderUnnamed}
                  </span>
                  <span className="font-sans text-[11px] text-carbon truncate">
                    {rider.email}
                  </span>
                  {rider.liveRideActive && (
                    <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-bold text-ink mt-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-signal-orange"
                        aria-hidden="true"
                      />
                      {t.admin.riderLiveRide}
                    </span>
                  )}
                </div>

                {/* Chip físico vinculado */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="md:hidden font-sans text-[10px] font-bold uppercase tracking-wider text-carbon">
                    {t.admin.columnChip}
                  </span>
                  {rider.device ? (
                    <>
                      <span className="font-sans tracking-widest text-micro font-bold text-ink">
                        {rider.device.code}
                      </span>
                      <span
                        className={`self-start font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border ${
                          rider.device.isNfcEncoded
                            ? "bg-parchment border-ember text-ink"
                            : "bg-paper border-mist text-carbon"
                        }`}
                      >
                        {rider.device.isNfcEncoded
                          ? t.admin.riderNfcEncoded
                          : t.admin.riderNfcPending}
                      </span>
                    </>
                  ) : (
                    <span className="font-sans text-micro text-carbon">
                      {t.admin.riderNoChip}
                    </span>
                  )}
                </div>

                {/* Estado real del chip */}
                <div className="flex flex-col gap-1">
                  <span className="md:hidden font-sans text-[10px] font-bold uppercase tracking-wider text-carbon">
                    {t.admin.columnStatus}
                  </span>
                  {rider.device ? (
                    <span
                      className={`self-start font-sans text-[11px] font-bold px-2 py-0.5 rounded-[3px] border ${
                        rider.device.status === "ACTIVE"
                          ? "bg-concrete border-ink text-ink"
                          : rider.device.status === "DISABLED"
                            ? "bg-paper border-mist text-carbon"
                            : "bg-paper border-signal-orange text-signal-orange"
                      }`}
                    >
                      {chipStatusLabel(rider.device.status)}
                    </span>
                  ) : (
                    <span className="font-sans text-micro text-carbon">—</span>
                  )}
                </div>

                {/* Fechas de alta y activación */}
                <div className="flex flex-col gap-0.5">
                  <span className="md:hidden font-sans text-[10px] font-bold uppercase tracking-wider text-carbon">
                    {t.admin.columnDates}
                  </span>
                  <span className="font-sans text-[11px] text-carbon">
                    {t.admin.riderRegisteredAt}:{" "}
                    <strong className="text-ink font-normal">
                      {formatDate(rider.registeredAt, locale)}
                    </strong>
                  </span>
                  <span className="font-sans text-[11px] text-carbon">
                    {t.admin.riderActivatedAt}:{" "}
                    <strong className="text-ink font-normal">
                      {rider.device?.activatedAt
                        ? formatDate(rider.device.activatedAt, locale)
                        : t.admin.riderNotActivated}
                    </strong>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
