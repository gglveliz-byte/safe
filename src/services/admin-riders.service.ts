/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Usuarios Registrados y Chips Vinculados
 * ARCHIVO: src/services/admin-riders.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Consulta de solo lectura para la consola de administración. Devuelve los
 * motociclistas reales registrados en PostgreSQL junto con el chip físico que
 * tienen vinculado (relación 1:1 User ↔ Device del esquema Prisma).
 *
 * No expone datos clínicos ni identificaciones nacionales: la operación del
 * panel requiere nombre, correo, folio, estado del chip y fechas de alta. El
 * PIN de activación permanece cifrado y nunca se incluye en esta respuesta.
 *
 * ENTRADAS: ninguna (consulta global ordenada por fecha de registro).
 * SALIDAS: lista tipada de AdminRiderRecord lista para serializar en la API.
 * DEPENDENCIAS: src/lib/db.ts (Prisma Client sobre Neon PostgreSQL).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados, mocks o demos.
 * - Comentarios y mensajes canónicos en Español.
 * ==============================================================================
 */

import { db } from "@/lib/db";

/**
 * Chip físico vinculado a la cuenta del motociclista.
 * Refleja exclusivamente columnas reales de la tabla Device.
 */
export interface AdminRiderDevice {
  /** Folio público grabado en el casco, ej. "SAFE-0001". */
  code: string;
  /** Ciclo de vida real del kit: UNCLAIMED | ACTIVE | DISABLED. */
  status: string;
  /** Indica si la antena NFC ya fue grabada en fábrica. */
  isNfcEncoded: boolean;
  /** UID físico hexadecimal del NTAG216, cuando existe. */
  nfcSerialNumber: string | null;
  /** Fecha UTC de activación del kit; null si aún está virgen. */
  activatedAt: string | null;
  /** Fecha UTC de emisión del folio durante la fabricación. */
  createdAt: string;
}

/**
 * Motociclista registrado en la plataforma y su eventual chip vinculado.
 * medicalProfile puede ser null cuando la cuenta existe pero la ficha clínica
 * aún no fue completada, caso que la vista muestra con un rótulo explícito.
 */
export interface AdminRiderRecord {
  /** Identificador UUID de la cuenta. */
  id: string;
  /** Correo de acceso normalizado. */
  email: string;
  /** Nombre completo declarado en la ficha médica, si existe. */
  fullName: string | null;
  /** Fotografía real servida por Cloudinary, si existe. */
  photoUrl: string | null;
  /** Estado real del Modo Ruta al momento de la consulta. */
  liveRideActive: boolean;
  /** Fecha UTC de creación de la cuenta. */
  registeredAt: string;
  /** Chip físico vinculado o null si la cuenta aún no reclama un kit. */
  device: AdminRiderDevice | null;
}

/**
 * Lista todos los usuarios con rol RIDER y su chip vinculado.
 * Ordena del registro más reciente al más antiguo para la operación diaria.
 */
export async function listRegisteredRiders(): Promise<AdminRiderRecord[]> {
  const users = await db.user.findMany({
    where: { role: "RIDER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      liveRideActive: true,
      createdAt: true,
      medicalProfile: {
        select: {
          fullName: true,
          photoUrl: true,
        },
      },
      device: {
        select: {
          code: true,
          status: true,
          isNfcEncoded: true,
          nfcSerialNumber: true,
          activatedAt: true,
          createdAt: true,
        },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    fullName: user.medicalProfile?.fullName ?? null,
    photoUrl: user.medicalProfile?.photoUrl ?? null,
    liveRideActive: user.liveRideActive,
    registeredAt: user.createdAt.toISOString(),
    device: user.device
      ? {
          code: user.device.code,
          status: user.device.status,
          isNfcEncoded: user.device.isNfcEncoded,
          nfcSerialNumber: user.device.nfcSerialNumber,
          activatedAt: user.device.activatedAt
            ? user.device.activatedAt.toISOString()
            : null,
          createdAt: user.device.createdAt.toISOString(),
        }
      : null,
  }));
}
