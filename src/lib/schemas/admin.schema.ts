/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Esquemas de Validación (Zod) — Administración y Fábrica de Hardware
 * ARCHIVO: src/lib/schemas/admin.schema.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Define los contratos de entrada para la generación secuencial de lotes
 * de kits físicos (POST /api/admin/batches), consulta y filtrado de lotes
 * (GET /api/admin/batches) y confirmación de grabado de antenas NFC
 * (PATCH /api/admin/encode-nfc).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Rechazo estricto de campos desconocidos (.strict()).
 * - Mensajes de error en Español.
 * ==============================================================================
 */

import { z } from "zod";
import { DeviceCodeSchema } from "./common.schema";

/**
 * Esquema para la creación de un nuevo lote físico de cascos/kits.
 * El nombre del lote debe ser único e identificar la orden de producción.
 */
export const CreateBatchSchema = z
  .object({
    /** Identificador o nombre del lote (ej. LOTE-2026-03-BOGOTA). */
    batchName: z
      .string({ required_error: "El nombre del lote es obligatorio." })
      .trim()
      .min(3, "El nombre del lote debe tener al menos 3 caracteres.")
      .max(80, "El nombre del lote no puede superar los 80 caracteres.")
      .regex(
        /^[\p{L}\p{N}\s\-_.,#():/]+$/u,
        "El nombre del lote contiene caracteres no válidos.",
      ),

    /** Cantidad de dispositivos secuenciales a generar en este lote (1 a 100). */
    quantity: z.coerce
      .number({ invalid_type_error: "La cantidad debe ser un número entero." })
      .int("La cantidad debe ser un número entero.")
      .min(1, "Debe generar al menos 1 dispositivo.")
      .max(100, "No puede generar más de 100 dispositivos por lote simultáneamente."),
  })
  .strict();

/**
 * Esquema para los parámetros de búsqueda y paginación en el listado de lotes.
 */
export const BatchesQuerySchema = z
  .object({
    /** Número de página para la paginación de resultados. */
    page: z.coerce.number().int().min(1).default(1).optional(),

    /** Cantidad de registros por página (1 a 100). */
    pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),

    /** Filtro opcional por nombre específico de lote para obtener su detalle. */
    batchName: z.string().trim().min(1).max(80).optional(),

    /** Bandera para revelar los PINs en texto plano (requiere privilegios de admin). */
    includePins: z.preprocess((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true" || val === "1";
      }
      return Boolean(val);
    }, z.boolean()).optional(),
  })
  .strict();

/**
 * Esquema para la confirmación de grabado del chip NFC físico (NTAG216).
 */
export const EncodeNfcSchema = z
  .object({
    /** Código de folio SAFE del casco grabado (ej. SAFE-0001). */
    code: DeviceCodeSchema,

    /** Número de serie de fábrica del chip NFC (UID de 7 bytes / 14-64 caracteres hex). */
    nfcSerialNumber: z
      .string({ required_error: "El número de serie NFC es obligatorio." })
      .trim()
      .min(8, "El número de serie NFC debe tener al menos 8 caracteres.")
      .max(64, "El número de serie NFC no puede superar los 64 caracteres.")
      .regex(/^[A-Fa-f0-9:-]+$/, "El número de serie NFC contiene caracteres inválidos."),

    /** Confirmación de que el chip fue bloqueado permanentemente como solo lectura. */
    isLockedReadOnly: z.boolean({
      required_error: "Debe confirmar el estado de bloqueo de solo lectura del chip.",
    }),
  })
  .strict();

export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;
export type BatchesQueryInput = z.infer<typeof BatchesQuerySchema>;
export type EncodeNfcInput = z.infer<typeof EncodeNfcSchema>;
