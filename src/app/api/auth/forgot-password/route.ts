/**
 * ==============================================================================
 * PROYECTO: SAFE — Emergency Medical & Real-Time GPS Ledger for Riders
 * MÓDULO: Autenticación — Solicitud de Recuperación de Contraseña
 * ARCHIVO: src/app/api/auth/forgot-password/route.ts
 * ------------------------------------------------------------------------------
 * DESCRIPCIÓN:
 * Endpoint público POST para solicitar el restablecimiento de contraseña.
 * Aplica limitación de tasa por IP y por correo para evitar abusos o bombardeo
 * de emails, busca el usuario en Neon PostgreSQL y genera un token JWT
 * firmado criptográficamente con una huella de versión de la contraseña actual.
 *
 * POLÍTICA DE SEGURIDAD ANTI-ENUMERACIÓN:
 * Responde SIEMPRE con HTTP 200 y mensaje neutral de éxito, sin importar si
 * el correo existe o no en el sistema, impidiendo que terceros rastreen qué
 * usuarios están registrados.
 *
 * ENTRADAS: JSON con { email, locale? }
 * SALIDAS: HTTP 200 con { success: true, data: { sent: true } }
 *
 * LEYES DE INGENIERÍA:
 * - Límite estricto < 500 líneas físicas.
 * - Cero datos hardcodeados o mocks de demostración.
 * - Validación Zod estricta (.strict()).
 * ==============================================================================
 */

import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/request";
import { logEvent } from "@/lib/logger";
import { successResponse, handleApiError, parseJsonBody } from "@/lib/api-response";
import { ForgotPasswordSchema } from "@/lib/schemas/auth.schema";
import { consumeRateLimit, enforceNotBlocked, RATE_LIMITS } from "@/services/ratelimit.service";
import { sendPasswordResetEmail } from "@/services/mail.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const input = await parseJsonBody(req, ForgotPasswordSchema);
    const clientIp = getClientIp(req);
    const normalizedEmail = input.email.trim().toLowerCase();

    // 1. Control de tasa: verificar que la IP y el correo no estén bloqueados
    await enforceNotBlocked("forgot-password-ip", clientIp, RATE_LIMITS.forgotPasswordIp);
    await enforceNotBlocked("forgot-password-email", normalizedEmail, RATE_LIMITS.forgotPasswordEmail);

    // Consumir cuota por IP y por correo
    await consumeRateLimit("forgot-password-ip", clientIp, RATE_LIMITS.forgotPasswordIp);
    await consumeRateLimit("forgot-password-email", normalizedEmail, RATE_LIMITS.forgotPasswordEmail);

    // 2. Buscar usuario en base de datos
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        medicalProfile: {
          select: { fullName: true, locale: true },
        },
      },
    });

    if (user) {
      // 3. Derivar clave simétrica para firmar token de recuperación
      const secretBytes = new TextEncoder().encode(getEnv().JWT_SECRET);

      // Huella de versión: primeros 10 caracteres del passwordHash actual.
      // Cuando el usuario cambia su clave, el hash muta y el token queda
      // automáticamente invalidado sin requerir base de datos adicional.
      const passwordVersion = user.passwordHash.slice(-10);

      const token = await new SignJWT({
        sub: user.id,
        email: user.email,
        purpose: "pwd_reset",
        pv: passwordVersion,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("safe")
        .setAudience("safe-app")
        .setIssuedAt()
        .setExpirationTime("15m") // Vigencia máxima de 15 minutos
        .sign(secretBytes);

      // 4. Construir URL canónica de restablecimiento
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const resetUrl = `${proto}://${host}/reset-password?token=${token}`;

      // 5. Despachar correo bilingüe con transporte SMTP de Gmail
      const chosenLocale = (user.medicalProfile?.locale === "en" || input.locale === "en") ? "en" : "es";
      const recipientName = user.medicalProfile?.fullName || undefined;

      await sendPasswordResetEmail(user.email, resetUrl, chosenLocale, recipientName);

      logEvent("info", "Token de recuperación emitido y despachado", {
        userId: user.id,
        correoOfuscado: user.email.slice(0, 3) + "***",
      });
    } else {
      // Si el correo no existe, simulamos tiempo de cómputo para mitigar ataques de temporización
      await new Promise((resolve) => setTimeout(resolve, 300));
      logEvent("info", "Solicitud de recuperación para correo no registrado (silencioso)", {
        correoOfuscado: normalizedEmail.slice(0, 3) + "***",
      });
    }

    // 6. Respuesta neutral para anti-enumeración
    return successResponse(
      {
        sent: true,
        message: "Si el correo está registrado en SAFE, hemos enviado las instrucciones de restablecimiento.",
      },
      200,
    );
  } catch (error) {
    return handleApiError(error, "auth.forgotPassword");
  }
}
