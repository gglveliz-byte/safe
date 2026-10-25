/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Hardware & Administración — Folios Secuenciales y PINs Criptográficos
 * ARCHIVO: src/services/device-code.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Servicio utilitario para el formateo, parsing y cálculo de secuencias de
 * folios de kits de cascos (SAFE-0001 a SAFE-9999) y la generación de PINs de
 * activación de 6 dígitos numéricos con entropía criptográfica (crypto.randomInt).
 *
 * Resuelve la siguiente secuencia atómica para la fabricación masiva de lotes
 * previniendo condiciones de carrera entre administradores concurrentes.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Comentarios en Español.
 * ==============================================================================
 */

import crypto from "node:crypto";
import { Prisma } from "@prisma/client";

/**
 * Formatea un número de secuencia en el código canónico de casco (ej. 1 -> SAFE-0001).
 */
export function formatDeviceCode(sequence: number): string {
  const padded = String(Math.max(1, Math.floor(sequence))).padStart(4, "0");
  return `SAFE-${padded}`;
}

/**
 * Parsea el número de secuencia entero a partir de un código con formato SAFE-XXXX.
 * Retorna null si el formato no coincide.
 */
export function parseDeviceCodeNumber(code: string): number | null {
  const match = code.trim().toUpperCase().match(/^SAFE-(\d+)$/);
  if (!match) {
    return null;
  }

  const num = parseInt(match[1], 10);
  return Number.isFinite(num) ? num : null;
}

/**
 * Genera un PIN confidencial de 6 dígitos con ceros iniciales garantizados
 * mediante un generador de números pseudoaleatorios criptográficamente seguro.
 */
export function generateActivationPin(): string {
  const pinNumber = crypto.randomInt(0, 1000000);
  return String(pinNumber).padStart(6, "0");
}

/**
 * Determina el siguiente número de secuencia de folio en la base de datos
 * dentro de una transacción activa.
 *
 * @param tx Cliente transaccional de Prisma.
 */
export async function resolveNextFolioSequence(
  tx: Prisma.TransactionClient,
): Promise<number> {
  // Intentar adquirir un bloqueo consultivo exclusivo en PostgreSQL para la secuencia de folios
  try {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(74332026)`;
  } catch {
    // Si la base de datos no es PostgreSQL nativo (ej. SQLite en pruebas), continuar sin error
  }

  // Buscar todos los dispositivos existentes para determinar el mayor folio asignado
  const devices = await tx.device.findMany({
    select: { code: true },
  });

  let maxSequence = 0;
  for (const device of devices) {
    const seq = parseDeviceCodeNumber(device.code);
    if (seq !== null && seq > maxSequence) {
      maxSequence = seq;
    }
  }

  return maxSequence + 1;
}
