/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Administración — Consulta, Activación y Eliminación de Usuarios y Chips
 * ARCHIVO: src/services/admin-riders.service.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Servicio administrativo para consultar motociclistas registrados con sus
 * fichas médicas y chips vinculados, gestionar la activación/desactivación
 * de cuentas sin destruir datos, y administrar la eliminación segura e
 * idempotente de usuarios y chips físicos.
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados, mocks o demos.
 * - Comentarios y mensajes canónicos en Español.
 * - Transacciones atómicas para operaciones multi-modelo.
 * ==============================================================================
 */

import { db } from "@/lib/db";

/** Chip físico vinculado a la cuenta del motociclista. */
export interface AdminRiderDevice {
  code: string;
  status: string;
  isNfcEncoded: boolean;
  nfcSerialNumber: string | null;
  activatedAt: string | null;
  createdAt: string;
}

/** Motociclista registrado en la plataforma y su eventual chip vinculado. */
export interface AdminRiderRecord {
  id: string;
  email: string;
  fullName: string | null;
  photoUrl: string | null;
  isActive: boolean;
  liveRideActive: boolean;
  registeredAt: string;
  device: AdminRiderDevice | null;
}

/** Resultado de una operación de eliminación administrativa. */
export interface AdminDeleteResult {
  success: boolean;
  notFound: boolean;
  deletedCount: number;
  message: string;
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
      isActive: true,
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
    isActive: user.isActive,
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

/**
 * Activa o desactiva la cuenta de un motociclista de forma segura.
 * - Desactivación: user.isActive = false. Si tiene un chip en ACTIVE, pasa a DISABLED
 *   para que el tag NFC / QR quede inerte de inmediato sin borrar el expediente.
 * - Activación: user.isActive = true. Si su chip estaba DISABLED, pasa de nuevo a ACTIVE.
 */
export async function setUserActiveStatus(
  userId: string,
  isActive: boolean,
): Promise<{
  success: boolean;
  notFound: boolean;
  isActive: boolean;
  message: string;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      device: { select: { id: true, code: true, status: true } },
    },
  });

  if (!user) {
    return {
      success: false,
      notFound: true,
      isActive: false,
      message: "El usuario no existe en el sistema.",
    };
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isActive },
    });

    if (user.device) {
      if (!isActive && user.device.status === "ACTIVE") {
        await tx.device.update({
          where: { id: user.device.id },
          data: { status: "DISABLED" },
        });
      } else if (isActive && user.device.status === "DISABLED") {
        await tx.device.update({
          where: { id: user.device.id },
          data: { status: "ACTIVE" },
        });
      }
    }
  });

  const estado = isActive ? "activada" : "desactivada";
  return {
    success: true,
    notFound: false,
    isActive,
    message: `Cuenta "${user.email}" ${estado} correctamente.`,
  };
}

/**
 * Elimina un usuario registrado y sus datos clínicos (cascade).
 * El chip vinculado queda liberado (SetNull en Device.userId).
 */
export async function deleteRegisteredUser(
  userId: string,
): Promise<AdminDeleteResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      device: { select: { id: true, code: true } },
    },
  });

  if (!user) {
    return {
      success: true,
      notFound: true,
      deletedCount: 0,
      message: "El usuario no existe en el sistema.",
    };
  }

  await db.$transaction(async (tx) => {
    // Si tenía un chip vinculado, se desvincula y vuelve a estado UNCLAIMED (virgen y reutilizable)
    if (user.device) {
      await tx.emergencyAlert.deleteMany({
        where: { deviceId: user.device.id },
      });

      await tx.device.update({
        where: { id: user.device.id },
        data: {
          userId: null,
          status: "UNCLAIMED",
          activatedAt: null,
          lastAlertLat: null,
          lastAlertLng: null,
        },
      });
    }

    // Se elimina el usuario y por CASCADE su perfil médico
    await tx.user.delete({
      where: { id: userId },
    });
  });

  return {
    success: true,
    notFound: false,
    deletedCount: 1,
    message: `Usuario "${user.email}" eliminado correctamente. El kit "${user.device?.code || "—"}" quedó liberado (UNCLAIMED) y disponible para activación.`,
  };
}

/**
 * Elimina un chip físico (device) y sus alertas (cascade).
 * El usuario queda con device=null (liberado para reasignación).
 */
export async function deleteDeviceByCode(
  code: string,
): Promise<AdminDeleteResult> {
  const device = await db.device.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      code: true,
      userId: true,
      status: true,
    },
  });

  if (!device) {
    return {
      success: true,
      notFound: true,
      deletedCount: 0,
      message: `El chip "${code}" no existe en el sistema.`,
    };
  }

  await db.device.delete({
    where: { id: device.id },
  });

  return {
    success: true,
    notFound: false,
    deletedCount: 1,
    message: `Chip "${device.code}" eliminado correctamente.`,
  };
}

/**
 * Elimina un usuario registrado Y su chip vinculado en una sola transacción.
 */
export async function deleteRegisteredUserWithDevice(
  userId: string,
): Promise<AdminDeleteResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      device: true,
      medicalProfile: true,
    },
  });

  if (!user) {
    return {
      success: true,
      notFound: true,
      deletedCount: 0,
      message: "El usuario no existe en el sistema.",
    };
  }

  await db.$transaction(async (tx) => {
    if (user.device) {
      await tx.device.delete({
        where: { id: user.device.id },
      });
    }

    await tx.user.delete({
      where: { id: userId },
    });
  });

  return {
    success: true,
    notFound: false,
    deletedCount: 1,
    message: `Usuario "${user.email}" y chip "${user.device?.code || "—"}" eliminados correctamente.`,
  };
}

/**
 * Purga completa de desarrollo/fábrica:
 * Elimina todos los motociclistas (User con rol RIDER), sus perfiles médicos,
 * todas las alertas de emergencia y todos los chips físicos (Device).
 * Mantiene intactas las cuentas con rol ADMIN.
 */
export async function purgeAllRidersAndDevices(): Promise<{
  success: boolean;
  deletedRiders: number;
  deletedDevices: number;
  message: string;
}> {
  return await db.$transaction(async (tx) => {
    // 1. Eliminar todos los dispositivos (cascade borra alertas de emergencia)
    const devicesDeleted = await tx.device.deleteMany({});

    // 2. Eliminar todos los usuarios con rol RIDER (cascade borra MedicalProfile)
    const ridersDeleted = await tx.user.deleteMany({
      where: { role: "RIDER" },
    });

    return {
      success: true,
      deletedRiders: ridersDeleted.count,
      deletedDevices: devicesDeleted.count,
      message: `Purga completa: ${ridersDeleted.count} pilotos y ${devicesDeleted.count} chips eliminados. Las cuentas ADMIN se conservaron.`,
    };
  });
}
