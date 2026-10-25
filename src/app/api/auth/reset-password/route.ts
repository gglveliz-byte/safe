/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Autenticación — Restablecimiento Seguro de Contraseña
 * ARCHIVO: src/app/api/auth/reset-password/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint público POST para ejecutar el cambio de contraseña mediante token
 * criptográfico de recuperación. Verifica la firma JWT simétrica, comprueba
 * la expiración (15 minutos), valida la huella de versión de la clave anterior
 * (impidiendo reutilización de tokens ya usados), calcula el nuevo hash
 * Bcrypt (coste 12) y actualiza el registro en Neon PostgreSQL.
 *
 * ENTRADAS: JSON con { token, password, confirmPassword }
 * SALIDAS: HTTP 200 con { success: true, data: { reset: true } }
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Validación Zod estricta (.strict() + .refine()).
 * ==============================================================================
 */

import { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/request";
import { logEvent } from "@/lib/logger";
import { hashPassword } from "@/lib/auth";
import { successResponse, handleApiError, parseJsonBody, AppError } from "@/lib/api-response";
import { ResetPasswordSchema } from "@/lib/schemas/auth.schema";
import { checkRateLimit, RATE_LIMITS } from "@/services/ratelimit.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const input = await parseJsonBody(req, ResetPasswordSchema);
    const clientIp = getClientIp(req);

    // 1. Control de tasa: máximo 5 intentos por IP cada 15 min
    await checkRateLimit(RATE_LIMITS.resetPasswordIp, clientIp);

    // 2. Verificar criptográficamente el token JWT
    const secretBytes = new TextEncoder().encode(getEnv().JWT_SECRET);
    let payload: JWTPayload;

    try {
      const verified = await jwtVerify(input.token, secretBytes, {
        issuer: "safe",
        audience: "safe-app",
      });
      payload = verified.payload;
    } catch {
      throw new AppError(
        "VALIDATION_ERROR",
        400,
        "El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.",
      );
    }

    // 3. Validar propósito y reclamaciones del token
    if (payload.purpose !== "pwd_reset" || !payload.sub || typeof payload.pv !== "string") {
      throw new AppError(
        "VALIDATION_ERROR",
        400,
        "El token proporcionado no corresponde a una solicitud de recuperación válida.",
      );
    }

    const userId = payload.sub;
    const tokenPasswordVersion = payload.pv;

    // 4. Buscar el usuario en Neon PostgreSQL
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("NOT_FOUND", 404, "El usuario asociado a este enlace ya no existe.");
    }

    // 5. Comparar huella de versión: si ya se cambió la clave antes, el token queda inservible
    const currentPasswordVersion = user.passwordHash.slice(-10);
    if (currentPasswordVersion !== tokenPasswordVersion) {
      throw new AppError(
        "VALIDATION_ERROR",
        400,
        "Este enlace de recuperación ya ha sido utilizado anteriormente. Solicita un nuevo enlace si lo necesitas.",
      );
    }

    // 6. Generar nuevo hash seguro Bcrypt (factor de costo 12)
    const newPasswordHash = await hashPassword(input.password);

    // 7. Actualizar la contraseña en la base de datos
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    logEvent("info", "Contraseña de usuario restablecida exitosamente", {
      userId: user.id,
      correoOfuscado: user.email.slice(0, 3) + "***",
    });

    return successResponse(
      { reset: true },
      "Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tus nuevas credenciales.",
    );
  } catch (error) {
    return handleApiError(error, "auth.resetPassword");
  }
}
