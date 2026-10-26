/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Fábrica de Lotes de Hardware y Grabado NFC
 * ARCHIVO: src/services/batch.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Servicio administrativo nuclear para la producción de hardware SAFE:
 * 1. Generación atómica de lotes de dispositivos con folios secuenciales
 *    (SAFE-XXXX) y PINs criptográficos reversibles para tarjetas de empaque.
 * 2. Consulta y resumen estadístico de lotes producidos (activos y grabados).
 * 3. Inspección detallada de lote con descifrado condicional de PINs para impresión.
 * 4. Grabado en serie de antenas NFC (NTAG216) y switch de solo lectura físico.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Persistencia atómica en PostgreSQL con transacciones Prisma.
 * - Comentarios en Español.
 * ==============================================================================
 */

import { db } from "@/lib/db";
import { AppError } from "@/lib/api-response";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { hashActivationPin } from "@/lib/auth";
import type { CreateBatchInput, EncodeNfcInput } from "@/lib/schemas/admin.schema";
import {
  formatDeviceCode,
  generateActivationPin,
  resolveNextFolioSequence,
} from "@/services/device-code.service";

/**
 * Respuesta devuelta tras la creación exitosa de un lote.
 * Incluye los PINs en texto plano exclusivamente para que el administrador
 * pueda generar e imprimir las tarjetas confidenciales del empaque.
 */
export interface CreatedBatch {
  batchName: string;
  createdAt: string;
  devices: Array<{
    code: string;
    activationPin: string;
  }>;
}

/**
 * Resumen consolidado de producción por lote.
 */
export interface BatchSummary {
  batchName: string;
  totalDevices: number;
  encodedDevices: number;
  activeDevices: number;
  /** Kits vírgenes (UNCLAIMED) disponibles para distribución. */
  unclaimedDevices: number;
  createdAt: string;
}

/**
 * Crea un lote de nuevos dispositivos con numeración secuencial atómica.
 */
export async function createBatch(input: CreateBatchInput): Promise<CreatedBatch> {
  const { batchName, quantity } = input;

  // Verificar si ya existe un lote con el mismo nombre
  const existingBatch = await db.device.findFirst({
    where: { batchName },
    select: { id: true },
  });

  if (existingBatch) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Ya existe un lote registrado con el nombre "${batchName}". Elija un nombre identificativo único.`,
      409,
    );
  }

  // Pre-generar los PINs y calcular sus hashes y cifrados
  const generatedDevices: Array<{
    code: string;
    pin: string;
    pinHash: string;
    pinEncrypted: string;
  }> = [];

  for (let i = 0; i < quantity; i++) {
    const pin = generateActivationPin();
    const pinHash = await hashActivationPin(pin);
    const pinEncrypted = encryptSecret(pin);
    generatedDevices.push({
      code: "", // se asignará dentro de la transacción
      pin,
      pinHash,
      pinEncrypted,
    });
  }

  // Transacción atómica en PostgreSQL
  const now = new Date();
  const createdRecords = await db.$transaction(async (tx) => {
    let nextSeq = await resolveNextFolioSequence(tx);
    const inserts = [];

    for (const item of generatedDevices) {
      const code = formatDeviceCode(nextSeq++);
      item.code = code;

      const device = await tx.device.create({
        data: {
          code,
          batchName,
          activationPinHash: item.pinHash,
          activationPinEncrypted: item.pinEncrypted,
          status: "UNCLAIMED",
          isNfcEncoded: false,
          isLockedReadOnly: false,
          createdAt: now,
          updatedAt: now,
        },
        select: {
          code: true,
        },
      });

      inserts.push(device);
    }

    return inserts;
  });

  return {
    batchName,
    createdAt: now.toISOString(),
    devices: generatedDevices.map((d) => ({
      code: d.code,
      activationPin: d.pin,
    })),
  };
}

/**
 * Lista todos los lotes agrupados con sus métricas de grabado y activación.
 */
export async function listBatches(): Promise<BatchSummary[]> {
  const devices = await db.device.findMany({
    select: {
      batchName: true,
      status: true,
      isNfcEncoded: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const batchMap = new Map<
    string,
    {
      total: number;
      encoded: number;
      active: number;
      unclaimed: number;
      createdAt: Date;
    }
  >();

  for (const dev of devices) {
    let current = batchMap.get(dev.batchName);
    if (!current) {
      current = {
        total: 0,
        encoded: 0,
        active: 0,
        unclaimed: 0,
        createdAt: dev.createdAt,
      };
      batchMap.set(dev.batchName, current);
    }

    current.total++;
    if (dev.isNfcEncoded) current.encoded++;
    if (dev.status === "ACTIVE") current.active++;
    if (dev.status === "UNCLAIMED") current.unclaimed++;
    if (dev.createdAt < current.createdAt) {
      current.createdAt = dev.createdAt;
    }
  }

  const summaries: BatchSummary[] = [];
  batchMap.forEach((val, name) => {
    summaries.push({
      batchName: name,
      totalDevices: val.total,
      encodedDevices: val.encoded,
      activeDevices: val.active,
      unclaimedDevices: val.unclaimed,
      createdAt: val.createdAt.toISOString(),
    });
  });

  return summaries;
}

/**
 * Obtiene el detalle individual de todos los cascos pertenecientes a un lote.
 */
export async function getBatchDetail(
  batchName: string,
  includePins = false,
): Promise<{
  batchName: string;
  devices: Array<{
    code: string;
    status: string;
    isNfcEncoded: boolean;
    nfcSerialNumber: string | null;
    createdAt: string;
    activatedAt: string | null;
    activationPin?: string;
  }>;
}> {
  const devices = await db.device.findMany({
    where: { batchName },
    orderBy: { code: "asc" },
  });

  if (devices.length === 0) {
    throw new AppError(
      "NOT_FOUND",
      `No se encontró ningún lote registrado con el nombre "${batchName}".`,
      404,
    );
  }

  return {
    batchName,
    devices: devices.map((dev) => {
      let pinPlain: string | undefined = undefined;
      if (includePins && dev.activationPinEncrypted) {
        try {
          pinPlain = decryptSecret(dev.activationPinEncrypted);
        } catch {
          pinPlain = undefined;
        }
      }

      return {
        code: dev.code,
        status: dev.status,
        isNfcEncoded: dev.isNfcEncoded,
        nfcSerialNumber: dev.nfcSerialNumber,
        createdAt: dev.createdAt.toISOString(),
        activatedAt: dev.activatedAt ? dev.activatedAt.toISOString() : null,
        ...(pinPlain ? { activationPin: pinPlain } : {}),
      };
    }),
  };
}

/**
 * Registra el grabado físico exitoso del chip NFC (NTAG216) en serie.
 */
export async function encodeNfc(input: EncodeNfcInput): Promise<{
  code: string;
  nfcSerialNumber: string;
  isNfcEncoded: boolean;
  isLockedReadOnly: boolean;
  encodedAt: string;
}> {
  const { code, nfcSerialNumber, isLockedReadOnly } = input;

  // 1. Verificar si el dispositivo existe
  const device = await db.device.findUnique({
    where: { code },
  });

  if (!device) {
    throw new AppError(
      "NOT_FOUND",
      `El casco con folio "${code}" no existe en el sistema.`,
      404,
    );
  }

  // 2. Verificar que el número de serie de la antena NFC no esté duplicado
  const existingSerial = await db.device.findFirst({
    where: {
      nfcSerialNumber,
      NOT: { code },
    },
    select: { code: true },
  });

  if (existingSerial) {
    throw new AppError(
      "VALIDATION_ERROR",
      `La antena NFC con número de serie "${nfcSerialNumber}" ya está grabada en el casco "${existingSerial.code}".`,
      409,
    );
  }

  const encodedAt = new Date();

  // 3. Actualizar registro físico en base de datos
  const updated = await db.device.update({
    where: { code },
    data: {
      nfcSerialNumber,
      isNfcEncoded: true,
      isLockedReadOnly,
      encodedAt,
    },
  });

  return {
    code: updated.code,
    nfcSerialNumber: updated.nfcSerialNumber ?? nfcSerialNumber,
    isNfcEncoded: updated.isNfcEncoded,
    isLockedReadOnly: updated.isLockedReadOnly,
    encodedAt: encodedAt.toISOString(),
  };
}

/**
 * Elimina un lote completo de chips de forma atómica.
 * Libera a cualquier usuario asociado y elimina en cascada las alertas.
 */
export async function deleteBatchByName(batchName: string): Promise<{
  success: boolean;
  deletedCount: number;
  message: string;
}> {
  const devices = await db.device.findMany({
    where: { batchName },
    select: { id: true, userId: true },
  });

  if (devices.length === 0) {
    return {
      success: true,
      deletedCount: 0,
      message: `El lote "${batchName}" no existe o ya estaba vacío.`,
    };
  }

  // Borrar todos los dispositivos del lote (cascade borra alertas de emergencia)
  const result = await db.device.deleteMany({
    where: { batchName },
  });

  return {
    success: true,
    deletedCount: result.count,
    message: `Lote "${batchName}" con ${result.count} kits eliminado correctamente.`,
  };
}

