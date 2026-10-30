/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Hardware & Dispositivos — Endpoint de Activación de Kit Post-Login
 * ARCHIVO: src/app/api/devices/claim/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint protegido (POST /api/devices/claim) para que un motociclista con sesión
 * activa vincule y active su kit físico (casco o sticker NFC/QR) mediante su
 * folio público y su PIN confidencial de 6 dígitos.
 *
 * Implementa control anti-fuerza-bruta en el PIN (5 intentos / 15 min),
 * verificación con Bcrypt contra `activationPinHash`, y asignación atómica
 * del dispositivo en PostgreSQL (Device.userId = user.id, Device.status = ACTIVE).
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas (módulo < 150 líneas).
 * - Cero datos hardcodeados o mocks de demostración.
 * - Runtime Node.js explícito y caché deshabilitada.
 * - Cabeceras y comentarios canónicos en Español.
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { requireRider } from "@/lib/auth";
import { getClientIp } from "@/lib/request";
import { decryptSecret } from "@/lib/crypto";
import {
  AppError,
  errorResponse,
  handleApiError,
  parseJsonBody,
  successResponse,
} from "@/lib/api-response";
import { ClaimDeviceSchema } from "@/lib/schemas/activate.schema";
import {
  clearThrottle,
  ensureThrottleAllowed,
  pinPolicy,
  registerThrottleFailure,
} from "@/services/throttle.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Exigir sesión autenticada con rol RIDER
    const { user } = await requireRider(request);
    const ip = getClientIp(request);

    // 2. Validar cuerpo con Zod (folio opcional y PIN de 6 dígitos)
    const input = await parseJsonBody(request, ClaimDeviceSchema);

    // 3. Protección anti-fuerza-bruta en PIN (5 fallos -> 15 min de bloqueo)
    const throttleKey = `${user.id}:${ip}`;
    await ensureThrottleAllowed("pin", throttleKey, pinPolicy());

    // 4. Localizar el dispositivo (reserva del usuario, folio explícito o resolución automática por PIN)
    let device: {
      id: string;
      code: string;
      status: string;
      userId: string | null;
      activationPinHash: string;
    } | null = null;

    // Verificar si el usuario ya tiene un kit reservado por haber escaneado un QR al registrarse
    const userReserved = await db.device.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        code: true,
        status: true,
        userId: true,
        activationPinHash: true,
      },
    });

    const targetCode = input.code ? input.code.trim().toUpperCase() : userReserved?.code;

    if (targetCode) {
      device = await db.device.findUnique({
        where: { code: targetCode },
        select: {
          id: true,
          code: true,
          status: true,
          userId: true,
          activationPinHash: true,
        },
      });

      if (!device || device.status === "DISABLED") {
        throw new AppError(
          "NOT_FOUND",
          "El kit de seguridad no fue encontrado o se encuentra deshabilitado.",
          404,
        );
      }

      const isPinValid = await bcrypt.compare(input.pin, device.activationPinHash);
      if (!isPinValid) {
        await registerThrottleFailure("pin", throttleKey, pinPolicy());
        return errorResponse(
          "FORBIDDEN",
          `El código PIN de activación no corresponde a tu casco ${device.code}.`,
          403,
        );
      }
    } else {
      // Resolución automática: busca entre los kits no reclamados cuál coincide con el PIN
      const unclaimed = await db.device.findMany({
        where: { status: "UNCLAIMED", userId: null },
        select: {
          id: true,
          code: true,
          status: true,
          userId: true,
          activationPinHash: true,
          activationPinEncrypted: true,
        },
      });

      for (const candidate of unclaimed) {
        if (!candidate.activationPinEncrypted) continue;
        try {
          if (decryptSecret(candidate.activationPinEncrypted) === input.pin.trim()) {
            device = candidate;
            break;
          }
        } catch {
          // Descarte silencioso de fallas de descifrado
        }
      }

      if (!device) {
        await registerThrottleFailure("pin", throttleKey, pinPolicy());
        return errorResponse(
          "FORBIDDEN",
          "El código PIN de activación no corresponde a ningún kit disponible o ya fue activado.",
          403,
        );
      }
    }

    // 5. Comprobar si ya está vinculado a otro usuario diferente
    if (device.userId && device.userId !== user.id) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Este kit de seguridad ya se encuentra vinculado a otra cuenta.",
        409,
      );
    }

    // 7. Transacción atómica: vincular Device al usuario y transicionar a ACTIVE
    const updatedDevice = await db.$transaction(async (tx) => {
      // Liberar cualquier chip anterior que el usuario pudiera tener asociado
      await tx.device.updateMany({
        where: { userId: user.id, id: { not: device.id } },
        data: { userId: null, status: "UNCLAIMED" },
      });

      return tx.device.update({
        where: { id: device.id },
        data: {
          userId: user.id,
          status: "ACTIVE",
          activatedAt: new Date(),
        },
        select: {
          id: true,
          code: true,
          status: true,
          activatedAt: true,
        },
      });
    });

    // 8. Limpiar intentos fallidos tras el éxito
    await clearThrottle("pin", throttleKey).catch(() => {});

    return successResponse({
      success: true,
      message: "¡Kit de seguridad vinculado y activado exitosamente!",
      device: {
        id: updatedDevice.id,
        code: updatedDevice.code,
        status: updatedDevice.status,
      },
    });
  } catch (error) {
    return handleApiError(error, "devices.claim");
  }
}
