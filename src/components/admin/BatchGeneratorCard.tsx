/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Generador de Lotes y Códigos QR
 * ARCHIVO: src/components/admin/BatchGeneratorCard.tsx
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Formulario de emisión de un lote físico de chips SAFE. Solicita el nombre
 * logístico del lote y la cantidad de folios (1-100); al enviarse, la vista
 * padre llama a POST /api/admin/batches, que persiste folios secuenciales y
 * PINs criptográficos en PostgreSQL. No imprime QR aquí: la plancha se abre
 * desde el inventario del lote ya emitido, con datos reales.
 *
 * ENTRADAS: valores controlados por la página y callbacks de cambio/emisión.
 * SALIDAS: formulario accesible, aviso de éxito y banner de error.
 * DEPENDENCIAS: useLocale, IncidentButton, IncidentCard.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero textos en duro: 100% diccionario bilingüe.
 * ==============================================================================
 */

"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";
import { IncidentButton } from "@/components/ui/IncidentButton";
import { IncidentCard } from "@/components/ui/IncidentCard";

export interface BatchGeneratorCardProps {
  /** Nombre logístico del lote que se va a emitir. */
  batchName: string;
  /** Cantidad de kits expresada como texto del input controlado. */
  quantity: string;
  /** Indica que la petición de emisión está en curso. */
  isGenerating: boolean;
  /** Aviso sobrio de éxito posterior a la emisión. */
  notice: string;
  /** Error humano devuelto por la emisión. */
  errorMessage: string;
  /** Actualiza el nombre del lote. */
  onBatchNameChange: (value: string) => void;
  /** Actualiza la cantidad de kits. */
  onQuantityChange: (value: string) => void;
  /** Envía el formulario para emitir el lote. */
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Tarjeta de emisión de lotes con validación nativa y mensajes del diccionario.
 * La cantidad 1-100 es la única regla de fábrica; el backend valida con Zod.
 */
export function BatchGeneratorCard({
  batchName,
  quantity,
  isGenerating,
  notice,
  errorMessage,
  onBatchNameChange,
  onQuantityChange,
  onCreate,
}: BatchGeneratorCardProps) {
  const { t } = useLocale();

  return (
    <IncidentCard padding="md" className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif font-bold text-heading-sm text-ink leading-tight">
          {t.admin.batchTitle}
        </h2>
        <p className="font-sans text-micro text-carbon mt-0.5">
          {t.admin.batchSubtitle}
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
      >
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label
            htmlFor="admin-batch-name"
            className="font-sans text-micro font-bold uppercase text-carbon"
          >
            {t.admin.batchNameLabel}
          </label>
          <input
            id="admin-batch-name"
            type="text"
            value={batchName}
            onChange={(event) => onBatchNameChange(event.target.value)}
            required
            placeholder={t.admin.batchNamePlaceholder}
            className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="admin-batch-quantity"
            className="font-sans text-micro font-bold uppercase text-carbon"
          >
            {t.admin.quantityLabel}
          </label>
          <input
            id="admin-batch-quantity"
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
            required
            placeholder={t.admin.quantityPlaceholder}
            className="h-11 px-3 bg-concrete border border-ink rounded-[4px] font-sans text-micro text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>

        <div className="sm:col-span-3 flex flex-wrap items-center gap-3 pt-1">
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
        </div>
      </form>

      {notice && (
        <div
          role="status"
          className="p-3 bg-concrete border border-ink rounded-[6px] text-micro text-ink font-sans text-center font-bold"
        >
          ✓ {notice}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="banner-emergency text-micro text-alert-red font-sans text-center"
        >
          ⚠️ {errorMessage}
        </div>
      )}
    </IncidentCard>
  );
}
